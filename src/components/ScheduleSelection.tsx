import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ArrowLeft, User, Clock, Info, Settings, Moon } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  participants: any[];
}

interface Participant {
  id: string;
  name: string;
  userType: 'office-worker' | 'university-student' | 'high-school-student' | 'middle-school-student' | 'custom';
  availability?: { [key: string]: boolean };
  submitted?: boolean;
}

interface ScheduleSelectionProps {
  event: Event;
  participant: Participant | null;
  onBack: () => void;
  onSubmit: (availability: { [key: string]: boolean }) => void;
  onJoinEvent: (participantData: { name: string; userType: string }) => void;
}

const USER_TYPE_PRESETS = {
  'office-worker': {
    label: '직장인',
    description: '평일 9시-18시 자동 제외 (수정 가능)',
    blockedHours: [9, 10, 11, 12, 13, 14, 15, 16, 17]
  },
  'university-student': {
    label: '대학생',
    description: '시간표 연동 또는 직접 입력',
    blockedHours: []
  },
  'high-school-student': {
    label: '고등학생',
    description: '8시-17시 자동 제외 (수정 가능)',
    blockedHours: [8, 9, 10, 11, 12, 13, 14, 15, 16]
  },
  'middle-school-student': {
    label: '중학생',
    description: '8시-16시 자동 제외 (수정 가능)',
    blockedHours: [8, 9, 10, 11, 12, 13, 14, 15]
  },
  'custom': {
    label: '직접 설정',
    description: '자유롭게 시간 설정',
    blockedHours: []
  }
};

export default function ScheduleSelection({ 
  event, 
  participant, 
  onBack, 
  onSubmit, 
  onJoinEvent 
}: ScheduleSelectionProps) {
  const [name, setName] = useState(participant?.name || '');
  const [userType, setUserType] = useState<string>(participant?.userType || '');
  const [availability, setAvailability] = useState<{ [key: string]: boolean }>(participant?.availability || {});
  const [isSelecting, setIsSelecting] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(!participant);
  
  const gridRef = useRef<HTMLDivElement>(null);

  const generateTimeSlots = () => {
    const slots = [];
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('ko-KR', { weekday: 'short' });
      
      for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const timeKey = `${dateStr}-${hour.toString().padStart(2, '0')}-${minute.toString().padStart(2, '0')}`;
          slots.push({
            key: timeKey,
            date: dateStr,
            hour,
            minute,
            dayName,
            display: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
          });
        }
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();
  const dates = [...new Set(timeSlots.map(slot => slot.date))];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // 모든 시간을 기본적으로 가능한 시간으로 초기화
  const initializeAllAvailable = () => {
    const newAvailability: { [key: string]: boolean } = {};
    timeSlots.forEach(slot => {
      newAvailability[slot.key] = true; // 기본값: 모든 시간 가능
    });
    return newAvailability;
  };

  const applyUserTypePreset = (type: string, baseAvailability: { [key: string]: boolean } = {}) => {
    const preset = USER_TYPE_PRESETS[type as keyof typeof USER_TYPE_PRESETS];
    if (!preset) return baseAvailability;

    const newAvailability = { ...baseAvailability };
    
    // Apply preset blocks only to weekdays for office workers and students
    dates.forEach(date => {
      const dayOfWeek = new Date(date).getDay();
      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
      
      if ((type === 'office-worker' || type.includes('student')) && isWeekday) {
        preset.blockedHours.forEach(hour => {
          // Remove both 30-minute slots for the hour
          const timeKey1 = `${date}-${hour.toString().padStart(2, '0')}-00`;
          const timeKey2 = `${date}-${hour.toString().padStart(2, '0')}-30`;
          delete newAvailability[timeKey1];
          delete newAvailability[timeKey2];
        });
      }
    });
    
    return newAvailability;
  };

  const handleNoEarlyHours = () => {
    const newAvailability = { ...availability };
    
    // 새벽 시간 (00:00-06:30) 제거
    dates.forEach(date => {
      for (let hour = 0; hour < 7; hour++) {
        const timeKey1 = `${date}-${hour.toString().padStart(2, '0')}-00`;
        const timeKey2 = `${date}-${hour.toString().padStart(2, '0')}-30`;
        delete newAvailability[timeKey1];
        delete newAvailability[timeKey2];
      }
    });
    
    setAvailability(newAvailability);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && userType) {
      onJoinEvent({ name, userType });
      setShowJoinForm(false);
      // 기본값으로 모든 시간 가능하게 설정 후 프리셋 적용
      const allAvailable = initializeAllAvailable();
      const withPreset = applyUserTypePreset(userType, allAvailable);
      setAvailability(withPreset);
    }
  };

  const handleUserTypeChange = (newUserType: string) => {
    setUserType(newUserType);
    // 현재 시간표에 프리셋 적용
    const currentAvailability = Object.keys(availability).length > 0 ? availability : initializeAllAvailable();
    const withPreset = applyUserTypePreset(newUserType, currentAvailability);
    setAvailability(withPreset);
  };

  const handleMouseDown = useCallback((timeKey: string) => {
    setIsSelecting(true);
    const isCurrentlySelected = availability[timeKey] === true;
    setAvailability(prev => {
      const updated = { ...prev };
      if (isCurrentlySelected) {
        // 선택됨 → 미선택 (삭제)
        delete updated[timeKey];
      } else {
        // 미선택 → 선택됨
        updated[timeKey] = true;
      }
      return updated;
    });
  }, [availability]);

  const handleMouseEnter = useCallback((timeKey: string) => {
    if (isSelecting) {
      const isCurrentlySelected = availability[timeKey] === true;
      setAvailability(prev => {
        const updated = { ...prev };
        if (isCurrentlySelected) {
          delete updated[timeKey];
        } else {
          updated[timeKey] = true;
        }
        return updated;
      });
    }
  }, [isSelecting, availability]);

  const handleMouseUp = useCallback(() => {
    setIsSelecting(false);
  }, []);

  const handleSubmitAvailability = () => {
    onSubmit(availability);
  };

  const handleSetAllAvailable = () => {
    const allAvailable = initializeAllAvailable();
    setAvailability(allAvailable);
  };

  const handleClearAll = () => {
    setAvailability({});
  };

  const getDateDisplay = (date: string) => {
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()} (${d.toLocaleDateString('ko-KR', { weekday: 'short' })})`;
  };

  // 초기 설정 (컴포넌트 마운트 시) - 기존 참여자가 아닌 경우만
  React.useEffect(() => {
    if (!showJoinForm && Object.keys(availability).length === 0 && !participant?.availability) {
      // 새로운 참여자인 경우만 기본값으로 모든 시간 가능하게 설정
      const allAvailable = initializeAllAvailable();
      const withPreset = userType ? applyUserTypePreset(userType, allAvailable) : allAvailable;
      setAvailability(withPreset);
    }
  }, [showJoinForm, userType]);

  if (showJoinForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <div className="mb-6">
            <Button onClick={onBack} variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              돌아가기
            </Button>
            <h1 className="text-green-600 mb-2">{event.title}</h1>
            <p className="text-muted-foreground">{event.description}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                참여자 정보 입력
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoinSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">이름 *</Label>
                  <Input
                    id="name"
                    placeholder="이름을 입력해주세요"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="userType">신분 선택 *</Label>
                  <Select value={userType} onValueChange={setUserType} required>
                    <SelectTrigger>
                      <SelectValue placeholder="신분을 선택해주세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(USER_TYPE_PRESETS).map(([key, preset]) => (
                        <SelectItem key={key} value={key}>
                          <div>
                            <div>{preset.label}</div>
                            <div className="text-xs text-muted-foreground">{preset.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {userType && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <strong>{USER_TYPE_PRESETS[userType as keyof typeof USER_TYPE_PRESETS]?.label} 선택됨</strong>
                        <p className="mt-1">{USER_TYPE_PRESETS[userType as keyof typeof USER_TYPE_PRESETS]?.description}</p>
                        {USER_TYPE_PRESETS[userType as keyof typeof USER_TYPE_PRESETS]?.blockedHours.length > 0 && (
                          <p className="mt-1">
                            자동으로 제외될 시간: {USER_TYPE_PRESETS[userType as keyof typeof USER_TYPE_PRESETS]?.blockedHours.join('시, ')}시
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full">
                  <Clock className="h-4 w-4 mr-2" />
                  시간 선택하러 가기
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="max-w-6xl mx-auto pt-8">
        <div className="mb-6">
          <Button onClick={onBack} variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            돌아가기
          </Button>
          <h1 className="text-green-600 mb-2">
            {participant?.name}님의 시간 선택 
            {participant?.submitted && <span className="text-sm text-muted-foreground">(수정 중)</span>}
          </h1>
          <p className="text-muted-foreground">
            가능한 시간을 클릭해서 선택해주세요. 초록색은 가능한 시간이고, 회색은 미선택 시간입니다. 각 시간은 30분 단위로 선택할 수 있습니다.
          </p>
        </div>

        <div className="grid gap-6">
          {/* 설정 패널 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                빠른 설정
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="userTypeSelect">신분 변경</Label>
                  <Select value={userType} onValueChange={handleUserTypeChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="신분을 선택해주세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(USER_TYPE_PRESETS).map(([key, preset]) => (
                        <SelectItem key={key} value={key}>
                          {preset.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>일괄 설정</Label>
                  <div className="flex gap-2">
                    <Button onClick={handleSetAllAvailable} variant="outline" size="sm">
                      전체 가능
                    </Button>
                    <Button onClick={handleClearAll} variant="outline" size="sm">
                      전체 초기화
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>시간대 설정</Label>
                  <Button onClick={handleNoEarlyHours} variant="outline" size="sm" className="w-full">
                    <Moon className="h-4 w-4 mr-2" />
                    새벽 시간은 싫어요
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                시간 선택표 (30분 단위)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>가능한 시간</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-200 rounded border"></div>
                  <span>미선택</span>
                </div>
              </div>

              {/* 가로 스크롤 가능한 시간표 */}
              <div 
                ref={gridRef}
                className="overflow-x-auto select-none"
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <div className="min-w-max">
                  {/* 날짜 헤더 */}
                  <div className="flex">
                    <div className="w-16 h-8 flex items-center justify-center border-b"></div>
                    {dates.map(date => (
                      <div key={date} className="w-20 h-8 flex items-center justify-center border-b text-sm">
                        {getDateDisplay(date)}
                      </div>
                    ))}
                  </div>
                  
                  {/* 시간별 행 */}
                  {hours.map(hour => (
                    <div key={hour} className="flex">
                      {/* 시간 라벨 */}
                      <div className="w-16 h-12 flex items-center justify-end pr-2 text-sm border-r">
                        {hour.toString().padStart(2, '0')}:00
                      </div>
                      
                      {/* 각 날짜별 30분 단위 블록 */}
                      {dates.map(date => (
                        <div key={`${date}-${hour}`} className="w-20 h-12 flex flex-col border-r border-b">
                          {/* 상반부 (00분) */}
                          {(() => {
                            const timeKey = `${date}-${hour.toString().padStart(2, '0')}-00`;
                            const isSelected = availability[timeKey] === true;
                            
                            return (
                              <div
                                className={`flex-1 border-b border-gray-300 cursor-pointer transition-colors ${
                                  isSelected 
                                    ? 'bg-green-500 hover:bg-green-600' 
                                    : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                                onMouseDown={() => handleMouseDown(timeKey)}
                                onMouseEnter={() => handleMouseEnter(timeKey)}
                                title={`${hour.toString().padStart(2, '0')}:00`}
                              />
                            );
                          })()}
                          
                          {/* 하반부 (30분) */}
                          {(() => {
                            const timeKey = `${date}-${hour.toString().padStart(2, '0')}-30`;
                            const isSelected = availability[timeKey] === true;
                            
                            return (
                              <div
                                className={`flex-1 cursor-pointer transition-colors ${
                                  isSelected 
                                    ? 'bg-green-500 hover:bg-green-600' 
                                    : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                                onMouseDown={() => handleMouseDown(timeKey)}
                                onMouseEnter={() => handleMouseEnter(timeKey)}
                                title={`${hour.toString().padStart(2, '0')}:30`}
                              />
                            );
                          })()}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowJoinForm(true)}>
              참여자 정보 수정
            </Button>
            <Button onClick={handleSubmitAvailability}>
              시간 {participant?.submitted ? '재제출' : '제출'}하기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
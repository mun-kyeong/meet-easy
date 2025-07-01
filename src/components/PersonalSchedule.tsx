import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, Save, Calendar, Clock, RotateCcw, Moon } from 'lucide-react';
import { toast } from 'sonner';

interface PersonalScheduleProps {
  onBack: () => void;
}

export default function PersonalSchedule({ onBack }: PersonalScheduleProps) {
  const [schedule, setSchedule] = useState<{ [key: string]: boolean }>({});
  const [isSelecting, setIsSelecting] = useState(false);

  const days = [
    { key: 'monday', label: '월요일', short: '월' },
    { key: 'tuesday', label: '화요일', short: '화' },
    { key: 'wednesday', label: '수요일', short: '수' },
    { key: 'thursday', label: '목요일', short: '목' },
    { key: 'friday', label: '금요일', short: '금' },
    { key: 'saturday', label: '토요일', short: '토' },
    { key: 'sunday', label: '일요일', short: '일' }
  ];

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const handleMouseDown = (timeKey: string) => {
    setIsSelecting(true);
    const isCurrentlySelected = schedule[timeKey] === true;
    setSchedule(prev => {
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
  };

  const handleMouseEnter = (timeKey: string) => {
    if (isSelecting) {
      const isCurrentlySelected = schedule[timeKey] === true;
      setSchedule(prev => {
        const updated = { ...prev };
        if (isCurrentlySelected) {
          delete updated[timeKey];
        } else {
          updated[timeKey] = true;
        }
        return updated;
      });
    }
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
  };

  const handleSave = () => {
    // 실제로는 서버에 저장
    localStorage.setItem('personalSchedule', JSON.stringify(schedule));
    toast.success('개인 시간표가 저장되었습니다!');
  };

  const handleReset = () => {
    setSchedule({});
    toast.success('시간표가 초기화되었습니다');
  };

  const loadCommonPresets = (preset: string) => {
    const newSchedule: { [key: string]: boolean } = {};
    
    if (preset === 'office-worker') {
      // 평일 9-18시 제외하고 나머지 시간은 가능으로 설정
      days.forEach(day => {
        for (let hour = 0; hour < 24; hour++) {
          const timeKey1 = `${day.key}-${hour}-00`;
          const timeKey2 = `${day.key}-${hour}-30`;
          
          const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(day.key);
          const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
          
          if (isWeekday && hour >= 9 && hour <= 17) {
            // 평일 9-18시는 제외 (미선택)
            continue;
          } else {
            // 나머지 시간은 가능으로 설정
            newSchedule[timeKey1] = true;
            newSchedule[timeKey2] = true;
          }
        }
      });
    } else if (preset === 'student') {
      // 평일 9-15시 제외하고 나머지 시간은 가능으로 설정
      days.forEach(day => {
        for (let hour = 0; hour < 24; hour++) {
          const timeKey1 = `${day.key}-${hour}-00`;
          const timeKey2 = `${day.key}-${hour}-30`;
          
          const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(day.key);
          const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
          
          if (isWeekday && hour >= 9 && hour <= 15) {
            // 평일 9-15시는 제외 (미선택)
            continue;
          } else {
            // 나머지 시간은 가능으로 설정
            newSchedule[timeKey1] = true;
            newSchedule[timeKey2] = true;
          }
        }
      });
    }
    
    setSchedule(newSchedule);
    toast.success(`${preset === 'office-worker' ? '직장인' : '학생'} 기본 스케줄이 적용되었습니다`);
  };

  const handleSetAllAvailable = () => {
    const newSchedule: { [key: string]: boolean } = {};
    days.forEach(day => {
      for (let hour = 0; hour < 24; hour++) {
        const timeKey1 = `${day.key}-${hour}-00`;
        const timeKey2 = `${day.key}-${hour}-30`;
        newSchedule[timeKey1] = true;
        newSchedule[timeKey2] = true;
      }
    });
    setSchedule(newSchedule);
    toast.success('모든 시간이 가능으로 설정되었습니다');
  };

  const handleNoEarlyHours = () => {
    const newSchedule = { ...schedule };
    
    // 새벽 시간 (00:00-06:30) 제거
    days.forEach(day => {
      for (let hour = 0; hour < 7; hour++) {
        const timeKey1 = `${day.key}-${hour}-00`;
        const timeKey2 = `${day.key}-${hour}-30`;
        delete newSchedule[timeKey1];
        delete newSchedule[timeKey2];
      }
    });
    
    setSchedule(newSchedule);
    toast.success('새벽 시간이 제외되었습니다');
  };

  React.useEffect(() => {
    // 저장된 스케줄 불러오기
    const saved = localStorage.getItem('personalSchedule');
    if (saved) {
      setSchedule(JSON.parse(saved));
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-4">
      <div className="max-w-6xl mx-auto pt-8">
        <div className="mb-6">
          <Button onClick={onBack} variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            홈으로 돌아가기
          </Button>
          <h1 className="text-indigo-600 mb-2">개인 주간 시간표</h1>
          <p className="text-muted-foreground">
            정기적으로 가능한 시간을 설정해두면, 새 모임을 만들 때 자동으로 반영됩니다. 30분 단위로 세밀하게 설정할 수 있습니다.
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  주간 시간표 (30분 단위)
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  가능한 시간을 드래그해서 선택하세요. 초록색은 가능한 시간입니다.
                </p>
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

                <div 
                  className="overflow-x-auto select-none"
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <div className="min-w-max">
                    {/* 요일 헤더 */}
                    <div className="flex">
                      <div className="w-16 h-8 flex items-center justify-center border-b"></div>
                      {days.map(day => (
                        <div key={day.key} className="w-20 h-8 flex items-center justify-center border-b text-sm">
                          {day.short}
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
                        
                        {/* 각 요일별 30분 단위 블록 */}
                        {days.map(day => (
                          <div key={`${day.key}-${hour}`} className="w-20 h-12 flex flex-col border-r border-b">
                            {/* 상반부 (00분) */}
                            {(() => {
                              const timeKey = `${day.key}-${hour}-00`;
                              const isSelected = schedule[timeKey] === true;
                              
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
                              const timeKey = `${day.key}-${hour}-30`;
                              const isSelected = schedule[timeKey] === true;
                              
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
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  빠른 설정
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4>일반적인 스케줄</h4>
                  <div className="space-y-2">
                    <Button 
                      onClick={() => loadCommonPresets('office-worker')}
                      variant="outline" 
                      className="w-full justify-start"
                    >
                      🏢 직장인 (평일 9-18시 제외)
                    </Button>
                    <Button 
                      onClick={() => loadCommonPresets('student')}
                      variant="outline" 
                      className="w-full justify-start"
                    >
                      📚 학생 (평일 9-15시 제외)
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4>시간대 설정</h4>
                  <div className="space-y-2">
                    <Button onClick={handleSetAllAvailable} variant="outline" className="w-full">
                      전체 가능
                    </Button>
                    <Button onClick={handleNoEarlyHours} variant="outline" className="w-full">
                      <Moon className="h-4 w-4 mr-2" />
                      새벽 시간은 싫어요
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4>시간표 관리</h4>
                  <div className="space-y-2">
                    <Button onClick={handleSave} className="w-full">
                      <Save className="h-4 w-4 mr-2" />
                      저장하기
                    </Button>
                    <Button onClick={handleReset} variant="outline" className="w-full">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      초기화
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>사용 팁</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• 드래그하여 여러 시간을 한 번에 선택할 수 있습니다</p>
                <p>• 30분 단위로 세밀하게 시간을 설정할 수 있습니다</p>
                <p>• 초록색으로 선택한 시간이 가능한 시간입니다</p>
                <p>• 정기적인 수업, 회의, 개인 약속 등을 제외하고 설정해두세요</p>
                <p>• 저장된 시간표는 새 모임 생성 시 자동으로 적용됩니다</p>
                <p>• 언제든지 수정하고 다시 저장할 수 있습니다</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
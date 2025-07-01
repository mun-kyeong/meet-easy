import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { ArrowLeft, Users, Share2, Calendar, Clock, UserPlus, Copy, MessageCircle, CheckCircle, MapPin, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  participants: Participant[];
}

interface Participant {
  id: string;
  name: string;
  userType: string;
  availability: { [key: string]: boolean };
  submitted: boolean;
}

interface ConfirmedMeeting {
  date: string;
  time: string;
  duration: number;
  location?: string;
  notes?: string;
}

interface GroupAvailabilityProps {
  event: Event;
  onBack: () => void;
  onJoinAsParticipant: (name: string) => void;
  onEditParticipantSchedule: (participant: Participant) => void;
  onConfirmMeeting: (meeting: ConfirmedMeeting) => void;
}

export default function GroupAvailability({ event, onBack, onJoinAsParticipant, onEditParticipantSchedule, onConfirmMeeting }: GroupAvailabilityProps) {
  const [newParticipantName, setNewParticipantName] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{date: string, time: string} | null>(null);
  const [meetingDuration, setMeetingDuration] = useState(2);
  const [meetingLocation, setMeetingLocation] = useState('');
  const [meetingNotes, setMeetingNotes] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const generateTimeSlots = () => {
    const slots = [];
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      
      for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const timeKey = `${dateStr}-${hour.toString().padStart(2, '0')}-${minute.toString().padStart(2, '0')}`;
          slots.push({
            key: timeKey,
            date: dateStr,
            hour,
            minute,
            display: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
          });
        }
      }
    }
    return slots;
  };

  const calculateAvailability = () => {
    const timeSlots = generateTimeSlots();
    const totalParticipants = event.participants.filter(p => p.submitted).length;
    
    if (totalParticipants === 0) return {};

    const availability: { [key: string]: number } = {};
    
    timeSlots.forEach(slot => {
      let availableCount = 0;
      event.participants.forEach(participant => {
        if (participant.submitted && participant.availability[slot.key] === true) {
          availableCount++;
        }
      });
      availability[slot.key] = availableCount;
    });
    
    return availability;
  };

  const findBestTimes = () => {
    const availability = calculateAvailability();
    const submittedParticipants = event.participants.filter(p => p.submitted);
    const totalParticipants = submittedParticipants.length;
    
    if (totalParticipants === 0) return [];
    
    const timeSlots = generateTimeSlots();
    const recommendations = [];
    
    // 100% 가능한 시간 찾기
    const perfectTimes = timeSlots.filter(slot => availability[slot.key] === totalParticipants);
    
    // 90% 이상 가능한 시간 찾기 (최소 1명은 불참)
    const goodTimes = timeSlots.filter(slot => {
      const count = availability[slot.key] || 0;
      return count >= Math.ceil(totalParticipants * 0.9) && count < totalParticipants;
    });
    
    // 80% 이상 가능한 시간 찾기
    const okTimes = timeSlots.filter(slot => {
      const count = availability[slot.key] || 0;
      return count >= Math.ceil(totalParticipants * 0.8) && count < Math.ceil(totalParticipants * 0.9);
    });
    
    if (perfectTimes.length > 0) {
      recommendations.push({
        title: `모든 참여자 가능 (${totalParticipants}명)`,
        times: perfectTimes.slice(0, 5),
        color: 'bg-green-600'
      });
    }
    
    if (goodTimes.length > 0) {
      recommendations.push({
        title: `90% 이상 참여자 가능`,
        times: goodTimes.slice(0, 5),
        color: 'bg-green-500'
      });
    }
    
    if (okTimes.length > 0) {
      recommendations.push({
        title: `80% 이상 참여자 가능`,
        times: okTimes.slice(0, 5),
        color: 'bg-green-400'
      });
    }
    
    return recommendations;
  };

  const handleJoinEvent = () => {
    if (newParticipantName.trim()) {
      onJoinAsParticipant(newParticipantName.trim());
      setNewParticipantName('');
    }
  };

  const handleEditSchedule = (participant: Participant) => {
    onEditParticipantSchedule(participant);
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}?event=${event.id}`;
    navigator.clipboard.writeText(link);
    toast.success('링크가 복사되었습니다!');
  };

  const handleShareKakao = () => {
    const message = `🗓️ "${event.title}" 모임 일정 조율\n\n${event.description}\n\n참여 기간: ${event.startDate} ~ ${event.endDate}\n\n아래 링크에서 가능한 시간을 선택해주세요!\n${window.location.origin}?event=${event.id}`;
    
    toast.success('카카오톡 공유 메시지가 준비되었습니다!');
    console.log('카카오톡 메시지:', message);
  };

  const handleTimeSlotClick = (date: string, time: string) => {
    setSelectedTimeSlot({ date, time });
    setShowConfirmDialog(true);
  };

  const handleConfirmMeeting = () => {
    if (selectedTimeSlot) {
      const meetingDetails: ConfirmedMeeting = {
        date: selectedTimeSlot.date,
        time: selectedTimeSlot.time,
        duration: meetingDuration,
        location: meetingLocation || undefined,
        notes: meetingNotes || undefined
      };
      onConfirmMeeting(meetingDetails);
      setShowConfirmDialog(false);
    }
  };

  const timeSlots = generateTimeSlots();
  const dates = [...new Set(timeSlots.map(slot => slot.date))];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const availability = calculateAvailability();
  const submittedParticipants = event.participants.filter(p => p.submitted);
  const totalParticipants = submittedParticipants.length;
  const recommendations = findBestTimes();

  const getDateDisplay = (date: string) => {
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()} (${d.toLocaleDateString('ko-KR', { weekday: 'short' })})`;
  };

  const getAvailabilityColor = (count: number) => {
    if (totalParticipants === 0) return 'bg-gray-200';
    
    const percentage = count / totalParticipants;
    
    if (percentage >= 1) return 'bg-green-600 cursor-pointer hover:bg-green-700';
    if (percentage >= 0.9) return 'bg-green-500 cursor-pointer hover:bg-green-600';
    if (percentage >= 0.8) return 'bg-green-400 cursor-pointer hover:bg-green-500';
    if (percentage >= 0.6) return 'bg-green-300 cursor-pointer hover:bg-green-400';
    if (percentage >= 0.4) return 'bg-yellow-300 cursor-pointer hover:bg-yellow-400';
    if (percentage >= 0.2) return 'bg-orange-300 cursor-pointer hover:bg-orange-400';
    if (percentage > 0) return 'bg-red-300 cursor-pointer hover:bg-red-400';
    return 'bg-gray-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
      <div className="max-w-7xl mx-auto pt-8">
        <div className="mb-6">
          <Button onClick={onBack} variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            홈으로 돌아가기
          </Button>
          <h1 className="text-purple-600 mb-2">{event.title}</h1>
          <p className="text-muted-foreground">{event.description}</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span>📅 {event.startDate} ~ {event.endDate}</span>
            <span>👥 {submittedParticipants.length}명 참여</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  그룹 가능 시간표
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  진한 초록색일수록 더 많은 참여자가 가능한 시간입니다. 시간을 클릭하여 모임을 확정할 수 있습니다.
                </p>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center gap-4 text-sm flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-600 rounded"></div>
                    <span>모든 참여자 가능</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span>90% 이상 가능</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-400 rounded"></div>
                    <span>80% 이상 가능</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-300 rounded"></div>
                    <span>일부 가능</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-200 rounded"></div>
                    <span>불가능</span>
                  </div>
                </div>

                {/* 가로 스크롤 가능한 시간표 */}
                <div className="overflow-x-auto">
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
                              const count = availability[timeKey] || 0;
                              
                              return (
                                <div
                                  className={`flex-1 border-b border-gray-300 transition-colors ${getAvailabilityColor(count)}`}
                                  title={`${hour}:00 - ${count}/${totalParticipants}명 가능`}
                                  onClick={() => count > 0 && handleTimeSlotClick(date, `${hour.toString().padStart(2, '0')}:00`)}
                                />
                              );
                            })()}
                            
                            {/* 하반부 (30분) */}
                            {(() => {
                              const timeKey = `${date}-${hour.toString().padStart(2, '0')}-30`;
                              const count = availability[timeKey] || 0;
                              
                              return (
                                <div
                                  className={`flex-1 transition-colors ${getAvailabilityColor(count)}`}
                                  title={`${hour}:30 - ${count}/${totalParticipants}명 가능`}
                                  onClick={() => count > 0 && handleTimeSlotClick(date, `${hour.toString().padStart(2, '0')}:30`)}
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
                  <UserPlus className="h-5 w-5" />
                  참여자 관리
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4>참여자 목록</h4>
                  <div className="space-y-2">
                    {event.participants.map(participant => (
                      <div key={participant.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2 flex-1">
                          <span>{participant.name}</span>
                          {participant.submitted && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditSchedule(participant)}
                              className="h-6 w-6 p-0"
                              title="스케줄 수정"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <Badge variant={participant.submitted ? "default" : "secondary"}>
                          {participant.submitted ? '완료' : '대기 중'}
                        </Badge>
                      </div>
                    ))}
                    {event.participants.length === 0 && (
                      <p className="text-sm text-muted-foreground">아직 참여자가 없습니다</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4>새 참여자 추가</h4>
                  <div className="flex gap-2">
                    <Input
                      placeholder="이름 입력"
                      value={newParticipantName}
                      onChange={(e) => setNewParticipantName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleJoinEvent()}
                    />
                    <Button onClick={handleJoinEvent}>추가</Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4>모임 공유</h4>
                  <div className="space-y-2">
                    <Button onClick={handleCopyLink} variant="outline" className="w-full">
                      <Copy className="h-4 w-4 mr-2" />
                      링크 복사
                    </Button>
                    <Button onClick={handleShareKakao} className="w-full">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      카카오톡 공유
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {submittedParticipants.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    추천 시간
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recommendations.length > 0 ? (
                    recommendations.map((rec, index) => (
                      <div key={index} className="space-y-2">
                        <h4 className="text-sm">{rec.title}</h4>
                        <div className="space-y-1">
                          {rec.times.slice(0, 3).map(time => {
                            const date = new Date(time.date);
                            const count = availability[time.key] || 0;
                            return (
                              <div 
                                key={time.key} 
                                className={`text-sm p-2 rounded cursor-pointer transition-colors ${rec.color} text-white hover:opacity-80`}
                                onClick={() => handleTimeSlotClick(time.date, time.display)}
                              >
                                {date.toLocaleDateString('ko-KR')} ({date.toLocaleDateString('ko-KR', { weekday: 'short' })}) {time.display}
                                <span className="ml-2 text-xs">({count}명)</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      더 많은 참여자가 시간을 선택하면 추천 시간이 표시됩니다
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                모임 일정 확정
              </DialogTitle>
              <DialogDescription>
                선택한 시간으로 모임을 확정하시겠습니까?
              </DialogDescription>
            </DialogHeader>
            
            {selectedTimeSlot && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-green-600" />
                    <span>선택된 시간</span>
                  </div>
                  <p>
                    {new Date(selectedTimeSlot.date).toLocaleDateString('ko-KR', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      weekday: 'long'
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedTimeSlot.time} 시작
                  </p>
                  {selectedTimeSlot && (
                    <p className="text-xs text-green-600 mt-1">
                      {availability[`${selectedTimeSlot.date}-${selectedTimeSlot.time.replace(':', '-')}`] || 0}명이 가능한 시간입니다
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="duration">모임 시간 (시간)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="0.5"
                      max="8"
                      step="0.5"
                      value={meetingDuration}
                      onChange={(e) => setMeetingDuration(parseFloat(e.target.value) || 0.5)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">장소 (선택사항)</Label>
                    <Input
                      id="location"
                      placeholder="모임 장소를 입력해주세요"
                      value={meetingLocation}
                      onChange={(e) => setMeetingLocation(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">추가 메모 (선택사항)</Label>
                    <Textarea
                      id="notes"
                      placeholder="참여자들에게 전달할 메시지가 있다면 입력해주세요"
                      value={meetingNotes}
                      onChange={(e) => setMeetingNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleConfirmMeeting} className="flex-1">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    일정 확정하기
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowConfirmDialog(false)}
                  >
                    취소
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
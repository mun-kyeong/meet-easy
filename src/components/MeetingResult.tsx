import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ArrowLeft, Calendar, Clock, Users, MapPin, Share2, Copy, MessageCircle, CheckCircle, Edit2 } from 'lucide-react';
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
  duration: number; // hours
  location?: string;
  notes?: string;
}

interface MeetingResultProps {
  event: Event;
  confirmedMeeting: ConfirmedMeeting;
  onBack: () => void;
  onEdit: () => void;
}

export default function MeetingResult({ event, confirmedMeeting, onBack, onEdit }: MeetingResultProps) {
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [editName, setEditName] = useState('');

  const submittedParticipants = event.participants.filter(p => p.submitted);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      full: date.toLocaleDateString('ko-KR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
      }),
      short: date.toLocaleDateString('ko-KR', { 
        month: 'numeric', 
        day: 'numeric',
        weekday: 'short'
      })
    };
  };

  const formatTime = (timeStr: string) => {
    return timeStr;
  };

  const getEndTime = (startTime: string, duration: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + (duration * 60);
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  };

  const handleEditParticipant = (participant: Participant) => {
    setEditingParticipant(participant);
    setEditName(participant.name);
  };

  const handleSaveEdit = () => {
    if (editingParticipant && editName.trim()) {
      // 실제로는 참여자 정보를 업데이트해야 함
      editingParticipant.name = editName.trim();
      setEditingParticipant(null);
      setEditName('');
      toast.success('참여자 이름이 수정되었습니다!');
    }
  };

  const handleCancelEdit = () => {
    setEditingParticipant(null);
    setEditName('');
  };

  const handleCopyDetails = () => {
    const dateFormatted = formatDate(confirmedMeeting.date);
    const startTime = formatTime(confirmedMeeting.time);
    const endTime = getEndTime(confirmedMeeting.time, confirmedMeeting.duration);
    
    const details = `📅 ${event.title}

🗓️ 일시: ${dateFormatted.full}
⏰ 시간: ${startTime} - ${endTime}
👥 참여자: ${submittedParticipants.map(p => p.name).join(', ')}
${confirmedMeeting.location ? `📍 장소: ${confirmedMeeting.location}` : ''}
${confirmedMeeting.notes ? `📝 메모: ${confirmedMeeting.notes}` : ''}

${event.description ? `\n설명: ${event.description}` : ''}`;

    navigator.clipboard.writeText(details);
    toast.success('모임 정보가 복사되었습니다!');
  };

  const handleShareKakao = () => {
    const dateFormatted = formatDate(confirmedMeeting.date);
    const startTime = formatTime(confirmedMeeting.time);
    const endTime = getEndTime(confirmedMeeting.time, confirmedMeeting.duration);
    
    const message = `🎉 "${event.title}" 모임 일정이 확정되었습니다!

📅 ${dateFormatted.full}
⏰ ${startTime} - ${endTime}
👥 참여자: ${submittedParticipants.map(p => p.name).join(', ')}

${confirmedMeeting.location ? `📍 ${confirmedMeeting.location}\n` : ''}
${confirmedMeeting.notes ? `📝 ${confirmedMeeting.notes}\n` : ''}

모두 시간 맞춰서 만나요! 😊`;

    toast.success('카카오톡 공유 메시지가 준비되었습니다!');
    console.log('카카오톡 메시지:', message);
  };

  const handleAddToCalendar = () => {
    const dateFormatted = formatDate(confirmedMeeting.date);
    const startTime = formatTime(confirmedMeeting.time);
    
    // Google Calendar URL 생성
    const startDateTime = new Date(`${confirmedMeeting.date}T${confirmedMeeting.time}`);
    const endDateTime = new Date(startDateTime.getTime() + (confirmedMeeting.duration * 60 * 60 * 1000));
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${startDateTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDateTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent(event.description || '모임 일정')}&location=${encodeURIComponent(confirmedMeeting.location || '')}`;
    
    window.open(googleCalendarUrl, '_blank');
  };

  const dateFormatted = formatDate(confirmedMeeting.date);
  const startTime = formatTime(confirmedMeeting.time);
  const endTime = getEndTime(confirmedMeeting.time, confirmedMeeting.duration);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <div className="mb-6">
          <Button onClick={onBack} variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            돌아가기
          </Button>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <h1 className="text-green-600">모임 일정이 확정되었습니다! 🎉</h1>
          </div>
          <p className="text-muted-foreground">
            아래 정보를 참여자들에게 공유해주세요
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  확정된 모임 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <h2 className="mb-4">{event.title}</h2>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">날짜</p>
                          <p>{dateFormatted.full}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">시간</p>
                          <p>{startTime} - {endTime} ({confirmedMeeting.duration}시간)</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">참여자 ({submittedParticipants.length}명)</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {submittedParticipants.map(participant => (
                              <Badge key={participant.id} variant="secondary">
                                {participant.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {confirmedMeeting.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">장소</p>
                            <p>{confirmedMeeting.location}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {event.description && (
                    <div className="mt-4 pt-4 border-t border-green-200">
                      <p className="text-sm text-muted-foreground mb-1">모임 설명</p>
                      <p>{event.description}</p>
                    </div>
                  )}
                  
                  {confirmedMeeting.notes && (
                    <div className="mt-4 pt-4 border-t border-green-200">
                      <p className="text-sm text-muted-foreground mb-1">추가 메모</p>
                      <p>{confirmedMeeting.notes}</p>
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-3 gap-3">
                  <Button onClick={handleCopyDetails} variant="outline" className="w-full">
                    <Copy className="h-4 w-4 mr-2" />
                    정보 복사
                  </Button>
                  <Button onClick={handleShareKakao} className="w-full">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    카카오톡 공유
                  </Button>
                  <Button onClick={handleAddToCalendar} variant="outline" className="w-full">
                    <Calendar className="h-4 w-4 mr-2" />
                    캘린더 추가
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>참여자별 응답 현황</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {event.participants.map(participant => (
                    <div key={participant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                          {participant.name.charAt(0)}
                        </div>
                        {editingParticipant?.id === participant.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="flex-1"
                              onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                            />
                            <Button size="sm" onClick={handleSaveEdit}>저장</Button>
                            <Button size="sm" variant="outline" onClick={handleCancelEdit}>취소</Button>
                          </div>
                        ) : (
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p>{participant.name}</p>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditParticipant(participant)}
                                className="h-6 w-6 p-0"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {participant.userType === 'office-worker' && '직장인'}
                              {participant.userType === 'university-student' && '대학생'}
                              {participant.userType === 'high-school-student' && '고등학생'}
                              {participant.userType === 'middle-school-student' && '중학생'}
                              {participant.userType === 'custom' && '기타'}
                            </p>
                          </div>
                        )}
                      </div>
                      {editingParticipant?.id !== participant.id && (
                        <Badge variant={participant.submitted ? "default" : "secondary"}>
                          {participant.submitted ? '응답 완료' : '응답 대기'}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>다음 단계</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>일정 확정 완료</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-4 h-4 border-2 border-gray-300 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    </div>
                    <span>참여자들에게 공유</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-4 h-4 border-2 border-gray-300 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    </div>
                    <span>개인 캘린더에 추가</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-4 h-4 border-2 border-gray-300 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    </div>
                    <span>모임 D-Day 알림 설정</span>
                  </div>
                </div>

                <Button onClick={onEdit} variant="outline" className="w-full">
                  일정 수정하기
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>모임 통계</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">총 참여자</span>
                  <span>{event.participants.length}명</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">응답 완료</span>
                  <span>{submittedParticipants.length}명</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">응답률</span>
                  <span>
                    {event.participants.length > 0 
                      ? Math.round((submittedParticipants.length / event.participants.length) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">조율 기간</span>
                  <span>
                    {Math.ceil((new Date(event.endDate).getTime() - new Date(event.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1}일
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
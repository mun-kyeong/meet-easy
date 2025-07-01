import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { ArrowLeft, Calendar, Share2 } from 'lucide-react';

interface EventCreationProps {
  onBack: () => void;
  onCreateEvent: (eventData: {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
  }) => void;
}

export default function EventCreation({ onBack, onCreateEvent }: EventCreationProps) {
  const getDefaultDateRange = () => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    return {
      start: today.toISOString().split('T')[0],
      end: nextWeek.toISOString().split('T')[0]
    };
  };

  const defaultDates = getDefaultDateRange();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(defaultDates.start);
  const [endDate, setEndDate] = useState(defaultDates.end);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title && startDate && endDate) {
      onCreateEvent({
        title,
        description,
        startDate,
        endDate
      });
    }
  };

  const isFormValid = title.trim() && startDate && endDate && new Date(startDate) <= new Date(endDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <div className="mb-6">
          <Button 
            onClick={onBack}
            variant="ghost" 
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            돌아가기
          </Button>
          <h1 className="text-blue-600 mb-2">새 모임 만들기</h1>
          <p className="text-muted-foreground">
            모임 정보를 입력하고 참여자들과 공유할 수 있는 링크를 생성해보세요
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              모임 정보 입력
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">모임 제목 *</Label>
                <Input
                  id="title"
                  placeholder="예: 팀 프로젝트 회의, 스터디 모임, 친목 모임"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">모임 설명</Label>
                <Textarea
                  id="description"
                  placeholder="모임의 목적이나 안건을 간단히 설명해주세요"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">시작 날짜 *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">종료 날짜 *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    required
                  />
                </div>
              </div>

              {startDate && endDate && new Date(startDate) > new Date(endDate) && (
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-sm text-red-600">
                    ⚠️ 종료 날짜는 시작 날짜보다 늦어야 합니다
                  </p>
                </div>
              )}

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="mb-2 text-blue-800">💡 모임 생성 후 할 수 있는 일</h4>
                <ul className="space-y-1 text-sm text-blue-700">
                  <li>• 참여자들에게 카카오톡이나 문자로 링크 공유</li>
                  <li>• 실시간으로 참여자들의 가능한 시간 확인</li>
                  <li>• 모든 참여자가 가능한 최적의 시간 자동 추천</li>
                  <li>• 확정된 일정을 다시 카카오톡으로 공유</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={!isFormValid}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  모임 만들고 공유하기
                </Button>
                <Button type="button" variant="outline" onClick={onBack}>
                  취소
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
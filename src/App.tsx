import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { Button } from "./components/ui/button";
import {
  Calendar,
  Clock,
  Users,
  UserCheck,
} from "lucide-react";
import { Toaster } from "./components/ui/sonner";
import EventCreation from "./components/EventCreation";
import ScheduleSelection from "./components/ScheduleSelection";
import GroupAvailability from "./components/GroupAvailability";
import PersonalSchedule from "./components/PersonalSchedule";
import MeetingResult from "./components/MeetingResult";

type AppState =
  | "home"
  | "create-event"
  | "schedule-selection"
  | "group-view"
  | "personal-schedule"
  | "meeting-result";

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  participants: Participant[];
}

interface Participant {
  id: string;
  name: string;
  userType:
    | "office-worker"
    | "university-student"
    | "high-school-student"
    | "middle-school-student"
    | "custom";
  availability: { [key: string]: boolean }; // key format: "YYYY-MM-DD-HH-MM"
  submitted: boolean;
}

interface ConfirmedMeeting {
  date: string;
  time: string;
  duration: number;
  location?: string;
  notes?: string;
}

export default function App() {
  const [currentView, setCurrentView] =
    useState<AppState>("home");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentEvent, setCurrentEvent] =
    useState<Event | null>(null);
  const [currentParticipant, setCurrentParticipant] =
    useState<Participant | null>(null);
  const [confirmedMeeting, setConfirmedMeeting] =
    useState<ConfirmedMeeting | null>(null);

  const handleCreateEvent = (
    eventData: Omit<Event, "id" | "createdAt" | "participants">,
  ) => {
    const newEvent: Event = {
      ...eventData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      participants: [],
    };
    setCurrentEvent(newEvent);
    setCurrentView("group-view");
  };

  const handleJoinEvent = (
    participantData: Omit<
      Participant,
      "id" | "availability" | "submitted"
    >,
  ) => {
    const newParticipant: Participant = {
      ...participantData,
      id: Math.random().toString(36).substr(2, 9),
      availability: {},
      submitted: false,
    };
    setCurrentParticipant(newParticipant);
    setCurrentView("schedule-selection");
  };

  const handleEditParticipantSchedule = (
    participant: Participant,
  ) => {
    // 기존 참여자의 스케줄을 편집하기 위해 currentParticipant에 설정
    setCurrentParticipant(participant);
    setCurrentView("schedule-selection");
  };

  const handleSubmitAvailability = (availability: {
    [key: string]: boolean;
  }) => {
    if (currentParticipant && currentEvent) {
      const updatedParticipant = {
        ...currentParticipant,
        availability,
        submitted: true,
      };

      // 기존 참여자인지 새 참여자인지 확인
      const existingParticipantIndex =
        currentEvent.participants.findIndex(
          (p) => p.id === currentParticipant.id,
        );

      let updatedParticipants;
      if (existingParticipantIndex >= 0) {
        // 기존 참여자 업데이트
        updatedParticipants = [...currentEvent.participants];
        updatedParticipants[existingParticipantIndex] =
          updatedParticipant;
      } else {
        // 새 참여자 추가
        updatedParticipants = [
          ...currentEvent.participants,
          updatedParticipant,
        ];
      }

      const updatedEvent = {
        ...currentEvent,
        participants: updatedParticipants,
      };

      setCurrentEvent(updatedEvent);
      setCurrentParticipant(null);
      setCurrentView("group-view");
    }
  };

  const handleConfirmMeeting = (
    meetingDetails: ConfirmedMeeting,
  ) => {
    setConfirmedMeeting(meetingDetails);
    setCurrentView("meeting-result");
  };

  const renderHome = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 pt-8">
          <h1 className="mb-4 text-blue-600">
            🗓️ 모임 일정 조율
          </h1>
          <p className="text-muted-foreground">
            간편하게 모임 일정을 조율하고 모든 참여자가 가능한
            최적의 시간을 찾아보세요
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-blue-600" />
                회원으로 시작하기
              </CardTitle>
              <CardDescription>
                개인 시간표를 저장하고 이전 모임을 관리할 수
                있어요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  개인 주간 시간표 저장
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  이전 모임 기록 관리
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  반복 모임 템플릿
                </div>
              </div>
              <div className="space-y-2">
                <Button
                  onClick={() => setIsLoggedIn(true)}
                  className="w-full"
                  disabled={isLoggedIn}
                >
                  {isLoggedIn ? "로그인됨" : "로그인"}
                </Button>
                {isLoggedIn && (
                  <Button
                    onClick={() =>
                      setCurrentView("personal-schedule")
                    }
                    variant="outline"
                    className="w-full"
                  >
                    개인 시간표 관리
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                비회원으로 시작하기
              </CardTitle>
              <CardDescription>
                간단하게 모임을 만들고 링크로 참여자를
                초대해보세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  빠른 모임 생성
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  링크 공유로 초대
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  실시간 일정 조율
                </div>
              </div>
              <Button
                onClick={() => setCurrentView("create-event")}
                className="w-full"
                variant="outline"
              >
                새 모임 만들기
              </Button>
            </CardContent>
          </Card>
        </div>

        {isLoggedIn && (
          <Card>
            <CardHeader>
              <CardTitle>회원 전용 기능</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <Button
                  onClick={() => setCurrentView("create-event")}
                  className="w-full"
                >
                  새 모임 만들기
                </Button>
                <Button
                  onClick={() =>
                    setCurrentView("personal-schedule")
                  }
                  variant="outline"
                  className="w-full"
                >
                  개인 시간표 관리
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {currentView === "home" && renderHome()}
      {currentView === "create-event" && (
        <EventCreation
          onBack={() => setCurrentView("home")}
          onCreateEvent={handleCreateEvent}
        />
      )}
      {currentView === "schedule-selection" && currentEvent && (
        <ScheduleSelection
          event={currentEvent}
          participant={currentParticipant}
          onBack={() => setCurrentView("group-view")}
          onSubmit={handleSubmitAvailability}
          onJoinEvent={handleJoinEvent}
        />
      )}
      {currentView === "group-view" && currentEvent && (
        <GroupAvailability
          event={currentEvent}
          onBack={() => setCurrentView("home")}
          onJoinAsParticipant={(name) =>
            handleJoinEvent({ name, userType: "custom" })
          }
          onEditParticipantSchedule={
            handleEditParticipantSchedule
          }
          onConfirmMeeting={handleConfirmMeeting}
        />
      )}
      {currentView === "personal-schedule" && (
        <PersonalSchedule
          onBack={() => setCurrentView("home")}
        />
      )}
      {currentView === "meeting-result" &&
        currentEvent &&
        confirmedMeeting && (
          <MeetingResult
            event={currentEvent}
            confirmedMeeting={confirmedMeeting}
            onBack={() => setCurrentView("home")}
            onEdit={() => setCurrentView("group-view")}
          />
        )}
      <Toaster />
    </div>
  );
}
import React, { useState, useRef, useEffect } from 'react';
import { Loader, Sparkles } from '../Icons';
import * as geminiService from '../../services/geminiService';
import * as dataService from '../../services/dataService'; // FIX: Imported dataService
import { Toast, EmployeeUser } from '../../types';

const MicIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>
);
const StopCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><rect x="9" y="9" width="6" height="6"></rect></svg>
);

interface AIAudioTranscriptionPageProps {
  addToast: (message: string, type: Toast['type']) => void;
  isAIOff: boolean;
  currentUser: EmployeeUser | null;
}

const AIAudioTranscriptionPage: React.FC<AIAudioTranscriptionPageProps> = ({ addToast, isAIOff, currentUser }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleStartRecording = async () => {
    if (isAIOff) {
      addToast('AI機能は現在無効です。', 'error');
      return;
    }
    setTranscription('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.addEventListener("dataavailable", event => {
        audioChunksRef.current.push(event.data);
      });

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      addToast('マイクへのアクセス許可が必要です。', 'error');
      console.error(err);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.addEventListener("stop", async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        handleTranscription(audioBlob);
        
        // Stop all tracks to turn off the microphone indicator
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
      });
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTranscription = async (audioBlob: Blob) => {
    setIsLoading(true);
    // FIX: Added currentUser check and passed userId to transcribeAudio
    if (!currentUser) {
        addToast('ユーザー情報が見つかりません。', 'error');
        setIsLoading(false);
        return;
    }
    try {
      // FIX: Pass currentUser.id as the second argument
      const result = await geminiService.transcribeAudio(audioBlob, currentUser.id);
      // FIX: Set only the text property of the result object
      setTranscription(result.text);
      // FIX: Save artifact
      await dataService.addAIArtifact(result.artifactData);
      addToast('文字起こしが完了し、AIドキュメントに保存されました。', 'success');
    } catch (e) {
      addToast(e instanceof Error ? `文字起こしエラー: ${e.message}` : '不明なエラーが発生しました。', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 space-y-4 text-center">
        <h2 className="text-xl font-semibold">AI 音声文字起こし</h2>
        <div className="flex justify-center my-6">
          {!isRecording ? (
            <button
              onClick={handleStartRecording}
              disabled={isAIOff || isLoading}
              className="flex flex-col items-center justify-center w-32 h-32 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 transition-all transform hover:scale-105 disabled:bg-slate-400"
            >
              <MicIcon className="w-12 h-12" />
              <span className="mt-1 font-semibold">録音開始</span>
            </button>
          ) : (
            <button
              onClick={handleStopRecording}
              className="flex flex-col items-center justify-center w-32 h-32 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all animate-pulse"
            >
              <StopCircleIcon className="w-12 h-12" />
              <span className="mt-1 font-semibold">録音停止</span>
            </button>
          )}
        </div>
        {isAIOff && <p className="text-sm text-red-500">AI機能は現在無効です。</p>}
      </div>

      {(isLoading || transcription) && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-2">文字起こし結果</h3>
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg whitespace-pre-wrap text-base">
              {transcription}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIAudioTranscriptionPage;
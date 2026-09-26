"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, Square, RefreshCw, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { analyzeVoice } from '../services/api';
import { useUserStore } from '../store/userStore';
import { FoodSource } from '../types';

interface VoiceFoodInputProps {
  foodSource: FoodSource;
  onAnalysisSuccess?: () => void;
}

export default function VoiceFoodInput({ foodSource, onAnalysisSuccess }: VoiceFoodInputProps) {
  const router = useRouter();
  const { setCurrentAnalysis, setDishName } = useUserStore();

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Transcription review state
  const [transcript, setTranscript] = useState<string | null>(null);
  const [detectedFood, setDetectedFood] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [pendingAnalysis, setPendingAnalysis] = useState<any | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Maximum recording time limit (30 seconds)
  const MAX_RECORDING_SECONDS = 30;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    setError(null);
    setTranscript(null);
    setDetectedFood(null);
    setPendingAnalysis(null);
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Microphone access is not supported in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all audio tracks to turn off mic indicator
        stream.getTracks().forEach(track => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await handleAudioUpload(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => {
          if (prev >= MAX_RECORDING_SECONDS) {
            stopRecording();
            return MAX_RECORDING_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err: any) {
      console.error("Microphone error:", err);
      setError(err.message || "Could not access microphone. Please allow microphone permissions.");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleAudioUpload = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await analyzeVoice(audioBlob, foodSource);

      if (response.status === "external_api_error") {
        throw new Error(response.message || "Voice recognition is temporarily unavailable. You can type the food instead.");
      }

      if (response.status === "unknown" || !response.food_name) {
        setTranscript(response.transcript);
        setError("We couldn't confidently identify a food item from your speech. Please try speaking clearly or typing the dish name.");
        return;
      }

      setTranscript(response.transcript);
      setDetectedFood(response.food_name);
      setConfidence(response.confidence);
      setPendingAnalysis(response.analysis);

      // If confidence >= 0.70 and analysis is valid, proceed directly to risk assessment results
      if (response.analysis && response.confidence >= 0.70) {
        setDishName(response.food_name);
        setCurrentAnalysis(response.analysis);
        if (onAnalysisSuccess) onAnalysisSuccess();
        router.push('/result');
      }

    } catch (err: any) {
      console.error("Voice analysis error:", err);
      setError(err.message || "Voice analysis failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmAnalysis = () => {
    if (pendingAnalysis && detectedFood) {
      setDishName(detectedFood);
      setCurrentAnalysis(pendingAnalysis);
      if (onAnalysisSuccess) onAnalysisSuccess();
      router.push('/result');
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-[#E5E8EC] shadow-sm text-center">
      {/* 1. Processing State */}
      {isProcessing ? (
        <div className="py-8 flex flex-col items-center justify-center space-y-4 animate-in fade-in">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-[#1677FF]/20 border-t-[#1677FF] animate-spin flex items-center justify-center" />
            <Mic className="absolute inset-0 m-auto text-[#1677FF]" size={24} />
          </div>
          <div className="text-center">
            <h4 className="text-base font-bold text-[#15171A]">Analyzing your voice...</h4>
            <p className="text-xs text-[#69707A] mt-1">Transcribing English speech with Sarvam AI</p>
          </div>
        </div>
      ) : isRecording ? (
        /* 2. Recording Active State */
        <div className="py-6 flex flex-col items-center justify-center space-y-5 animate-in fade-in">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-red-100 animate-ping absolute inset-0 opacity-75" />
            <button
              onClick={stopRecording}
              aria-label="Stop voice recording"
              type="button"
              className="relative w-20 h-20 rounded-full bg-[#FF4D4F] text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-all hover:scale-105"
            >
              <Square size={28} />
            </button>
          </div>

          <div>
            <span className="text-lg font-mono font-bold text-[#FF4D4F]">
              {formatSeconds(recordingSeconds)}
            </span>
            <p className="text-sm font-semibold text-[#15171A] mt-1">Listening... Speak clearly in English</p>
            <p className="text-xs text-[#69707A] mt-0.5">Example: &ldquo;I had two samosas for lunch&rdquo;</p>
          </div>

          <button
            onClick={stopRecording}
            type="button"
            className="px-4 py-1.5 bg-[#F4F5F7] text-xs font-bold text-[#15171A] rounded-full border border-[#E5E8EC] hover:bg-gray-200 transition-colors"
          >
            Tap to Finish
          </button>
        </div>
      ) : detectedFood && pendingAnalysis ? (
        /* 3. Review & Confirmation State (for likely or confirmation flows) */
        <div className="py-4 space-y-4 text-left animate-in fade-in">
          <div className="bg-[#F4F5F7] rounded-xl p-4 border border-[#E5E8EC]">
            <span className="text-xs font-bold uppercase tracking-wider text-[#69707A] block mb-1">You said (English):</span>
            <p className="text-sm text-[#15171A] italic">&ldquo;{transcript}&rdquo;</p>
          </div>

          <div className="bg-[#E6F4FF] rounded-xl p-4 border border-[#1677FF]/20 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#1677FF] uppercase tracking-wider block">Detected Food Item</span>
              <h3 className="text-lg font-extrabold text-[#15171A] capitalize">{detectedFood}</h3>
              <div className="flex items-center gap-2 mt-1">
                {confidence && (
                  <span className="text-xs text-[#69707A]">Match: {Math.round(confidence * 100)}%</span>
                )}
                {pendingAnalysis?.risk_score !== undefined && pendingAnalysis.risk_score !== null && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white text-[#1677FF] border border-[#1677FF]/30">
                    Dietary Conflict Score: {pendingAnalysis.risk_score}/100
                  </span>
                )}
              </div>
            </div>
            <CheckCircle className="text-[#1677FF]" size={28} />
          </div>

          <div className="flex gap-3">
            <button
              onClick={startRecording}
              type="button"
              className="flex-1 py-2.5 px-4 bg-white border border-[#E5E8EC] text-xs font-bold text-[#69707A] rounded-xl hover:bg-gray-50 flex items-center justify-center gap-1.5"
            >
              <RefreshCw size={14} /> Try Again
            </button>
            <button
              onClick={confirmAnalysis}
              type="button"
              className="flex-1 py-2.5 px-4 bg-[#1677FF] text-white text-xs font-bold rounded-xl hover:bg-blue-600 flex items-center justify-center gap-1.5 shadow-md"
            >
              Analyze Food <ArrowRight size={14} />
            </button>
          </div>
        </div>
      ) : (
        /* 4. Default Idle State */
        <div className="py-6 flex flex-col items-center justify-center space-y-4">
          <button
            onClick={startRecording}
            aria-label="Start voice food input"
            type="button"
            className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#1677FF] to-blue-400 text-white flex items-center justify-center shadow-md hover:scale-105 transition-transform hover:shadow-lg"
          >
            <Mic size={28} />
          </button>

          <div>
            <h4 className="text-sm font-bold text-[#15171A]">Tap to Speak Your Food</h4>
            <p className="text-xs text-[#69707A] mt-1 max-w-xs mx-auto leading-relaxed">
              Say what you are eating in English (e.g. &ldquo;I had two samosas&rdquo; or &ldquo;Paneer butter masala with roti&rdquo;)
            </p>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-4 p-3 rounded-xl bg-[#FFF1F0] border border-[#FF4D4F]/20 text-xs text-[#FF4D4F] flex items-start gap-2 text-left animate-in fade-in">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

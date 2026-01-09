
import React, { useState, useRef } from 'react';
import { Button } from './components/Button';
import { ChatBot } from './components/ChatBot';
import { generateStoryFromImage, generateSpeech, decodeAudioData } from './services/geminiService';
import { StoryState, VoiceName } from './types';

const App: React.FC = () => {
  const [state, setState] = useState<StoryState>({
    image: null,
    paragraph: '',
    isGenerating: false,
    isNarrating: false,
    error: null
  });

  const [activeVoice, setActiveVoice] = useState<VoiceName>(VoiceName.Kore);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setState(prev => ({
          ...prev,
          image: event.target?.result as string,
          paragraph: '',
          error: null
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const generateStory = async () => {
    if (!state.image) return;
    
    setState(prev => ({ ...prev, isGenerating: true, error: null }));
    try {
      const story = await generateStoryFromImage(state.image);
      setState(prev => ({ ...prev, paragraph: story }));
    } catch (err) {
      setState(prev => ({ ...prev, error: "The model was unable to interpret your vision. Please try again." }));
    } finally {
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  const handleReadAloud = async () => {
    if (!state.paragraph || state.isNarrating) return;

    setState(prev => ({ ...prev, isNarrating: true }));
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      const ctx = audioContextRef.current;
      const audioBytes = await generateSpeech(state.paragraph, activeVoice);
      const audioBuffer = await decodeAudioData(audioBytes, ctx);
      
      // Stop previous narration if any
      if (currentSourceRef.current) {
        currentSourceRef.current.stop();
      }

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => setState(prev => ({ ...prev, isNarrating: false }));
      source.start();
      currentSourceRef.current = source;

    } catch (err) {
      console.error(err);
      setState(prev => ({ ...prev, isNarrating: false, error: "The voice failed to manifest. Please try again." }));
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Header */}
      <header className="text-center mb-12">
        <h1 className="serif text-5xl font-bold text-amber-950 mb-4 tracking-tight">Ink & Vision</h1>
        <p className="text-amber-800/80 text-lg max-w-2xl mx-auto">
          Upload an image to spark a story. Our AI companion will ghostwrite an atmospheric opening and breathe life into it with narrated voice.
        </p>
      </header>

      <main className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Left Column: Image Area */}
        <section className="space-y-6">
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-amber-100 border-2 border-dashed border-amber-300 flex flex-col items-center justify-center group transition-all hover:border-amber-400">
            {state.image ? (
              <>
                <img src={state.image} alt="Inspiration" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <label className="cursor-pointer bg-white/20 backdrop-blur-md px-6 py-3 rounded-full text-white font-medium border border-white/30 hover:bg-white/30 transition-colors">
                    Change Image
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>
              </>
            ) : (
              <label className="cursor-pointer flex flex-col items-center p-12 text-center">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4 text-amber-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>
                <p className="text-amber-900 font-semibold mb-1">Click to upload inspiration</p>
                <p className="text-amber-700/60 text-sm">PNG, JPG or WebP images</p>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={generateStory} 
              disabled={!state.image || state.isGenerating}
              isLoading={state.isGenerating}
              className="flex-1 min-w-[200px]"
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a2 2 0 00-1.96 1.414l-.547 2.188a2 2 0 00.75 2.183l1.59 1.192a2 2 0 002.396-.102l1.58-1.58a2 2 0 00.102-2.396l-1.192-1.59zm-7.428-7.428a2 2 0 00-1.022-.547l-2.387-.477a2 2 0 00-1.96 1.414l-.547 2.188a2 2 0 00.75 2.183l1.59 1.192a2 2 0 002.396-.102l1.58-1.58a2 2 0 00.102-2.396l-1.192-1.59zM10.744 2.13a1 1 0 011.126 0l2.433 1.622a1 1 0 01.372 1.126l-.64 2.133a1 1 0 01-1.126.64H8.72a1 1 0 01-1.126-.64l-.64-2.133a1 1 0 01.372-1.126L9.758 2.13z"></path></svg>}
            >
              {state.paragraph ? "Regenerate Opening" : "Manifest Story"}
            </Button>
          </div>
        </section>

        {/* Right Column: Story Output */}
        <section className={`transition-all duration-500 ${state.paragraph ? 'opacity-100 transform translate-y-0' : 'opacity-30 transform translate-y-4 pointer-events-none'}`}>
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-amber-100 min-h-[400px] flex flex-col relative">
            <div className="flex-1">
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-900/40">The Opening Chapter</span>
                <div className="flex items-center gap-2">
                   <select 
                    value={activeVoice} 
                    onChange={(e) => setActiveVoice(e.target.value as VoiceName)}
                    className="text-xs bg-amber-50 border-none rounded-full px-3 py-1 text-amber-800 outline-none cursor-pointer"
                   >
                    {Object.values(VoiceName).map(v => (
                      <option key={v} value={v}>Voice: {v}</option>
                    ))}
                   </select>
                </div>
              </div>
              
              {state.isGenerating ? (
                <div className="space-y-4">
                  <div className="h-4 bg-amber-50 rounded animate-pulse w-full"></div>
                  <div className="h-4 bg-amber-50 rounded animate-pulse w-[95%]"></div>
                  <div className="h-4 bg-amber-50 rounded animate-pulse w-[98%]"></div>
                  <div className="h-4 bg-amber-50 rounded animate-pulse w-[90%]"></div>
                </div>
              ) : (
                <p className="serif text-xl leading-relaxed text-amber-950 first-letter:text-5xl first-letter:font-bold first-letter:text-amber-900 first-letter:mr-3 first-letter:float-left">
                  {state.paragraph || "Upload an image and click 'Manifest Story' to reveal the opening lines of your tale."}
                </p>
              )}
            </div>

            <div className="mt-8 flex justify-end">
              <Button 
                variant="outline" 
                onClick={handleReadAloud} 
                disabled={!state.paragraph || state.isNarrating}
                isLoading={state.isNarrating}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg>}
              >
                Read Aloud
              </Button>
            </div>
          </div>
          
          {state.error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100 flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              {state.error}
            </div>
          )}
        </section>
      </main>

      <ChatBot />

      <footer className="mt-24 py-8 text-center text-amber-900/40 text-sm w-full border-t border-amber-100">
        &copy; {new Date().getFullYear()} Ink & Vision Storyteller. Built with Gemini AI.
      </footer>
    </div>
  );
};

export default App;

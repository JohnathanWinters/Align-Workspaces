import { useRef, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePipeline } from "./use-pipeline";
import { usePipelineGamification } from "./use-pipeline-gamification";
import { usePipelineKeyboard } from "./use-pipeline-keyboard";
import PipelineHeader from "./PipelineHeader";
import PipelineFilters from "./PipelineFilters";
import ContactList from "./ContactList";
import ContactDetail from "./ContactDetail";
import ContactForm from "./ContactForm";
import CsvImportModal from "./CsvImportModal";
import GamificationOverlay from "./GamificationOverlay";

interface PipelineManagerProps {
  token: string;
  onBack: () => void;
}

export default function PipelineManager({ token, onBack }: PipelineManagerProps) {
  const pipeline = usePipeline(token);
  const gamification = usePipelineGamification();
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Wire gamification to pipeline
  useEffect(() => {
    pipeline.onActivityLoggedRef.current = gamification.incrementActivity;
  }, [gamification.incrementActivity]);

  // Keyboard navigation
  usePipelineKeyboard({ pipeline, containerRef, searchRef });

  const { selectedContactId } = pipeline;
  const showDetail = !!selectedContactId;

  return (
    <>
      <GamificationOverlay show={gamification.showCelebration} />
      <div
        ref={containerRef}
        className="min-h-screen bg-[#faf9f7]"
        tabIndex={0}
        style={{ outline: "none" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <PipelineHeader pipeline={pipeline} onBack={onBack} streak={{ todayCount: gamification.todayCount, streakDays: gamification.streakDays }} />
          <PipelineFilters pipeline={pipeline} searchRef={searchRef} />

          {/* Master-Detail Layout */}
          {isMobile ? (
            // Mobile: show list or detail, not both
            showDetail ? (
              <div className="bg-white rounded-xl border border-gray-100 min-h-[60vh]">
                <ContactDetail pipeline={pipeline} isMobile onCelebrate={gamification.celebrate} />
              </div>
            ) : (
              <ContactList pipeline={pipeline} />
            )
          ) : (
            // Desktop: resizable split panels
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden" style={{ height: "calc(100vh - 260px)", minHeight: "500px" }}>
              <ResizablePanelGroup direction="horizontal">
                <ResizablePanel defaultSize={showDetail ? 50 : 100} minSize={30}>
                  <div className="h-full overflow-y-auto">
                    <ContactList pipeline={pipeline} />
                  </div>
                </ResizablePanel>
                {showDetail && (
                  <>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={50} minSize={30}>
                      <div className="h-full overflow-hidden">
                        <ContactDetail pipeline={pipeline} onCelebrate={gamification.celebrate} />
                      </div>
                    </ResizablePanel>
                  </>
                )}
              </ResizablePanelGroup>
            </div>
          )}
        </div>
      </div>

      {/* Overlays */}
      <AnimatePresence>
        <ContactForm pipeline={pipeline} />
        <CsvImportModal pipeline={pipeline} />
      </AnimatePresence>
    </>
  );
}

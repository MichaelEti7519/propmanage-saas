import { Hero } from './landing/Hero';
import { StorySection } from './landing/StorySection';
import { WorkspaceSection } from './landing/WorkspaceSection';
import { RolesSection } from './landing/RolesSection';
import { WorkflowSection } from './landing/WorkflowSection';
import { AvailabilitySection } from './landing/AvailabilitySection';
import { FaqSection } from './landing/FaqSection';
import { CtaSection } from './landing/CtaSection';

export function Landing() {
  return (
    <div className="flex-1 overflow-hidden bg-[#FAF8F3] pb-20 md:pb-0">
      <Hero />
      <StorySection />
      <WorkspaceSection />
      <RolesSection />
      <WorkflowSection />
      <AvailabilitySection />
      <FaqSection />
      <CtaSection />
    </div>
  );
}

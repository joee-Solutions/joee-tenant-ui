import TrainingGuideForm from "@/components/admin/TrainingGuideForm";

export default function CreateTrainingGuidePage() {
  return (
    <div className="px-12 pb-20 flex flex-col gap-[30px] w-full">
      <TrainingGuideForm mode="create" />
    </div>
  );
} 
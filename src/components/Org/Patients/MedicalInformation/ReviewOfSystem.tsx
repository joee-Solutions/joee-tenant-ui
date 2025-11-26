import { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { usePathname } from "next/navigation";

// Define the type for form data
type FormData = {
  [key: string]: boolean | string;
};

export default function MedicalSymptomForm() {
  const pathname = usePathname();
  const slug = pathname?.split('/organization/')[1]?.split('/')[0] || '';

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`review-system-${slug}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          setFormData(parsed);
        }
      } catch (e) {
        console.error("Error loading review system from localStorage:", e);
      }
    }
  }, [slug]);

  const [formData, setFormData] = useState<FormData>({
    // Genitourinary
    urinaryFrequency: false,
    dysuria: false,
    incontinence: false,
    genitourinaryDetails: "",

    // Musculoskeletal
    jointPain: false,
    muscleWeakness: false,
    stiffness: false,
    musculoskeletalDetails: "",

    // Neurological
    headaches: false,
    dizziness: false,
    numbnessWeakness: false,
    seizures: false,
    neurologicalDetails: "",

    // Psychiatric
    depression: false,
    anxiety: false,
    sleepingDisturbances: false,
    psychiatricDetails: "",

    // Endocrine
    heatColdIntolerance: false,
    excessiveThirstHunger: false,
    endocrineDetails: "",

    // Haematologic/Lymphatic
    easyBruising: false,
    bleedingTendencies: false,
    haematologicDetails: "",

    // Allergic/Immunologic
    frequentInfections: false,
    allergicReactions: false,
    allergicDetails: "",
  });

  // Auto-save to localStorage
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      localStorage.setItem(`review-system-${slug}`, JSON.stringify(formData));
    }, 1000);
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [formData, slug]);

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData({ ...formData, [name]: checked });
  };

  const handleTextChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const SymptomSection = ({
    title,
    checkboxes,
    detailsName,
  }: {
    title: string;
    checkboxes: { name: string; label: string }[];
    detailsName: string;
  }) => (
    <div className="mx-auto p-6">
      <h3 className="font-medium text-gray-800 mb-4">{title}:</h3>
      <div className="flex flex-wrap gap-8 mb-4">
        {checkboxes.map(({ name, label }) => (
          <label key={name} className="flex items-center space-x-2 ">
            <Checkbox
            className="accent-green-600 w-6 h-6 rounded"
              checked={!!formData[name]}
              onCheckedChange={(checked) =>
                handleCheckboxChange(name, !!checked)
              }
            />
            <span className="text-gray-700">{label}</span>
          </label>
        ))}
      </div>
      <div>
        <p className="text-gray-700 mb-2">Details</p>
        <Textarea
          name={detailsName}
          value={String(formData[detailsName] || "")}
          onChange={(e) => handleTextChange(detailsName, e.target.value)}
          className="w-full border border-[#737373] rounded p-2 h-32 focus:outline-none focus:ring-2 focus:ring-[#003465] focus:border-[#003465]"
        />
      </div>
    </div>
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form Data Submitted:", formData);
    // Handle form submission logic here
  };

  return (
    <div className=" mb-8">
      <form onSubmit={handleSubmit}>
        <SymptomSection
          title="Genitourinary"
          checkboxes={[
            { name: "urinaryFrequency", label: "Urinary frequency" },
            { name: "dysuria", label: "Dysuria" },
            { name: "incontinence", label: "Incontinence" },
          ]}
          detailsName="genitourinaryDetails"
        />

        <SymptomSection
          title="Musculoskeletal"
          checkboxes={[
            { name: "jointPain", label: "Joint pain" },
            { name: "muscleWeakness", label: "Muscle Weakness" },
            { name: "stiffness", label: "Stiffness" },
          ]}
          detailsName="musculoskeletalDetails"
        />

        <SymptomSection
          title="Neurological"
          checkboxes={[
            { name: "headaches", label: "Headaches" },
            { name: "dizziness", label: "Dizziness" },
            { name: "numbnessWeakness", label: "Numbness/Weakness" },
            { name: "seizures", label: "Seizures" },
          ]}
          detailsName="neurologicalDetails"
        />

        <SymptomSection
          title="Psychiatric"
          checkboxes={[
            { name: "depression", label: "Depression" },
            { name: "anxiety", label: "Anxiety" },
            { name: "sleepingDisturbances", label: "Sleeping Disturbances" },
          ]}
          detailsName="psychiatricDetails"
        />

        <SymptomSection
          title="Endocrine"
          checkboxes={[
            { name: "heatColdIntolerance", label: "Heat/Cold Intolerance" },
            { name: "excessiveThirstHunger", label: "Excessive Thirst/Hunger" },
          ]}
          detailsName="endocrineDetails"
        />

        <SymptomSection
          title="Haematologic/Lymphatic"
          checkboxes={[
            { name: "easyBruising", label: "Easy Bruising" },
            { name: "bleedingTendencies", label: "Bleeding Tendencies" },
          ]}
          detailsName="haematologicDetails"
        />

        <SymptomSection
          title="Allergic/Immunologic"
          checkboxes={[
            { name: "frequentInfections", label: "Frequent Infections" },
            { name: "allergicReactions", label: "Allergic Reactions" },
          ]}
          detailsName="allergicDetails"
        />

        {/* Save button removed - form saves automatically */}
      </form>
    </div>
  );
}
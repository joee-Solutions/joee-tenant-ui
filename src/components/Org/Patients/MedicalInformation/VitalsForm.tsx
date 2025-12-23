import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

// Define the type for a vital sign entry
type VitalSignEntry = {
  id: number;
  date: string;
  temperature: string;
  systolic: string;
  diastolic: string;
  heartRate: string;
  respiratoryRate: string;
  oxygenSaturation: string;
  glucose: string;
  height: string;
  weight: string;
  bmi: string;
  painScore: string;
};

export default function VitalSignsForm() {
  const pathname = usePathname();
  const slug = pathname?.split('/organization/')[1]?.split('/')[0] || '';
  
  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`vitals-${slug}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setVitalSignEntries(parsed);
        }
      } catch (e) {
        console.error("Error loading vitals from localStorage:", e);
      }
    }
  }, [slug]);

  const [vitalSignEntries, setVitalSignEntries] = useState<VitalSignEntry[]>([
    {
      id: 1,
      date: new Date().toISOString().split('T')[0],
      temperature: "",
      systolic: "",
      diastolic: "",
      heartRate: "",
      respiratoryRate: "",
      oxygenSaturation: "",
      glucose: "",
      height: "",
      weight: "",
      bmi: "",
      painScore: "",
    },
  ]);

  // Auto-save to localStorage
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      localStorage.setItem(`vitals-${slug}`, JSON.stringify(vitalSignEntries));
    }, 1000);
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [vitalSignEntries, slug]);

  const addVitalSignEntry = (): void => {
    const newId =
      vitalSignEntries.length > 0
        ? Math.max(...vitalSignEntries.map((entry) => entry.id)) + 1
        : 1;

    setVitalSignEntries([
      ...vitalSignEntries,
      {
        id: newId,
        date: new Date().toISOString().split('T')[0],
        temperature: "",
        systolic: "",
        diastolic: "",
        heartRate: "",
        respiratoryRate: "",
        oxygenSaturation: "",
        glucose: "",
        height: "",
        weight: "",
        bmi: "",
        painScore: "",
      },
    ]);
  };

  const removeVitalSignEntry = (id: number): void => {
    if (vitalSignEntries.length > 1) {
      setVitalSignEntries(vitalSignEntries.filter((entry) => entry.id !== id));
    }
  };

  const updateVitalSignEntry = (
    id: number,
    field: keyof VitalSignEntry,
    value: string
  ): void => {
    setVitalSignEntries(
      vitalSignEntries.map((entry) => {
        if (entry.id === id) {
          const updated = { ...entry, [field]: value };
          // Auto-calculate BMI when height or weight changes
          if (field === "height" || field === "weight") {
            const height = parseFloat(updated.height);
            const weight = parseFloat(updated.weight);
            if (height > 0 && weight > 0) {
              // BMI = weight (kg) / (height (m))^2
              // Assuming height is in cm, convert to meters
              const heightInMeters = height / 100;
              const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(2);
              updated.bmi = bmi;
            } else {
              updated.bmi = "";
            }
          }
          return updated;
        }
        return entry;
      })
    );
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    console.log("Vital Signs Form submitted:", vitalSignEntries);
  };

  return (
    <div className=" mx-auto p-6 bg-white ">
      <h1 className="text-2xl font-bold mb-6">Vital Signs</h1>

      <form onSubmit={handleSubmit}>
        {vitalSignEntries.map((entry, index) => (
          <div key={entry.id} className="mb-8 border-b pb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Vital Sign Entry {index + 1}</h2>
              <div className="flex gap-2">
                {vitalSignEntries.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => removeVitalSignEntry(entry.id)}
                    variant="outline"
                    className="border border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 h-[60px] px-6 font-normal text-base"
                  >
                    Remove
                  </Button>
                )}
                {index === vitalSignEntries.length - 1 && (
                  <Button
                    type="button"
                    onClick={addVitalSignEntry}
                    className="font-normal text-base text-white bg-[#003465] h-[60px] px-6 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Another
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Date Field */}
              <div>
                <label className="block text-base text-black font-normal mb-2" htmlFor={`date-${entry.id}`}>
                  Date *
                </label>
                <Input
                  id={`date-${entry.id}`}
                  type="date"
                  className="w-full h-14 p-3 border border-[#737373] rounded"
                  value={entry.date}
                  onChange={(e) =>
                    updateVitalSignEntry(entry.id, "date", e.target.value) as any
                  }
                  onBlur={(e) =>
                    updateVitalSignEntry(entry.id, "date", e.target.value) as any
                  }
                  name="date"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-base text-black font-normal mb-2" htmlFor={`temperature-${entry.id}`}>
                  Temperature (°F/°C)
                </label>
                <Input
                  id={`temperature-${entry.id}`}
                  type="text"
                  placeholder="Temperature"
                  className="w-full h-14 p-3 border border-[#737373] rounded"
                  value={entry.temperature}
                  onChange={(e) =>
                    updateVitalSignEntry(entry.id, "temperature", e.target.value) as any
                  }
                  onBlur={(e) =>
                    updateVitalSignEntry(entry.id, "temperature", e.target.value) as any
                  }
                  name="temperature"
                />
              </div>
              <div>
                <label className="block text-base text-black font-normal mb-2" htmlFor={`systolic-${entry.id}`}>
                  Systolic (mmHg)
                </label>
                <Input
                  id={`systolic-${entry.id}`}
                  type="text"
                  placeholder="Systolic"
                  className="w-full h-14 p-3 border border-[#737373] rounded"
                  value={entry.systolic}
                  onChange={(e) =>
                    updateVitalSignEntry(entry.id, "systolic", e.target.value) as any
                  }
                  onBlur={(e) =>
                    updateVitalSignEntry(entry.id, "systolic", e.target.value) as any
                  }
                  name="systolic"

                />
              </div>
              <div>
                <label className="block text-base text-black font-normal mb-2" htmlFor={`diastolic-${entry.id}`}>
                  Diastolic (mmHg)
                </label>
                <Input
                  id={`diastolic-${entry.id}`}
                  type="text"
                  placeholder="Diastolic"
                  className="w-full h-14 p-3 border border-[#737373] rounded"
                  value={entry.diastolic}
                  onChange={(e) =>
                    updateVitalSignEntry(entry.id, "diastolic", e.target.value) as any
                  }
                  onBlur={(e) =>
                    updateVitalSignEntry(entry.id, "diastolic", e.target.value) as any
                  }
                  name="diastolic"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-base text-black font-normal mb-2" htmlFor={`heartRate-${entry.id}`}>
                  Heart Rate (bpm)
                </label>
                <Input
                  id={`heartRate-${entry.id}`}
                  type="text"
                  placeholder="Heart Rate"
                  className="w-full h-14 p-3 border border-[#737373] rounded"
                  value={entry.heartRate}
                  onChange={(e) =>
                    updateVitalSignEntry(entry.id, "heartRate", e.target.value) as any
                  }
                  onBlur={(e) =>
                    updateVitalSignEntry(entry.id, "heartRate", e.target.value) as any
                  }
                  name="heartRate"


                />
              </div>
              <div>
                <label className="block text-base text-black font-normal mb-2" htmlFor={`respiratoryRate-${entry.id}`}>
                  Respiratory Rate (breaths/min)
                </label>
                <Input
                  id={`respiratoryRate-${entry.id}`}
                  type="text"
                  placeholder="Respiratory Rate"
                  className="w-full h-14 p-3 border border-[#737373] rounded"
                  value={entry.respiratoryRate}
                  onChange={(e) =>
                    updateVitalSignEntry(entry.id, "respiratoryRate", e.target.value) as any
                  }
                  onBlur={(e) =>
                    updateVitalSignEntry(entry.id, "respiratoryRate", e.target.value) as any
                  }
                  name="respiratoryRate"



                />
              </div>
              <div>
                <label className="block text-base text-black font-normal mb-2" htmlFor={`oxygenSaturation-${entry.id}`}>
                  Oxygen Saturation (%)
                </label>
                <Input
                  id={`oxygenSaturation-${entry.id}`}
                  type="text"
                  placeholder="Oxygen Saturation"
                  className="w-full h-14 p-3 border border-[#737373] rounded"
                  value={entry.oxygenSaturation}
                  onChange={(e) =>
                    updateVitalSignEntry(entry.id, "oxygenSaturation", e.target.value) as any
                  }
                  onBlur={(e) =>
                    updateVitalSignEntry(entry.id, "oxygenSaturation", e.target.value) as any
                  }
                  name="oxygenSaturation"




                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-base text-black font-normal mb-2" htmlFor={`glucose-${entry.id}`}>
                  Glucose
                </label>
                <Input
                  id={`glucose-${entry.id}`}
                  type="text"
                  placeholder="Glucose"
                  className="w-full h-14 p-3 border border-[#737373] rounded"
                  value={entry.glucose}
                  onChange={(e) =>
                    updateVitalSignEntry(entry.id, "glucose", e.target.value) as any
                  }
                  onBlur={(e) =>
                    updateVitalSignEntry(entry.id, "glucose", e.target.value) as any
                  }
                  name="glucose"
                />
              </div>
              <div>
                <label className="block text-base text-black font-normal mb-2" htmlFor={`height-${entry.id}`}>
                  Height (cm/in)
                </label>
                <Input
                  id={`height-${entry.id}`}
                  type="text"
                  placeholder="Height"
                  className="w-full h-14 p-3 border border-[#737373] rounded"
                  value={entry.height}
                  onChange={(e) =>
                    updateVitalSignEntry(entry.id, "height", e.target.value) as any
                  }
                  onBlur={(e) =>
                    updateVitalSignEntry(entry.id, "height", e.target.value) as any
                  }
                  name="height"
                />
              </div>
              <div>
                <label className="block text-base text-black font-normal mb-2" htmlFor={`weight-${entry.id}`}>
                  Weight (kg/lbs)
                </label>
                <Input
                  id={`weight-${entry.id}`}
                  type="text"
                  placeholder="Weight"
                  className="w-full h-14 p-3 border border-[#737373] rounded"
                  value={entry.weight}
                  onChange={(e) =>
                    updateVitalSignEntry(entry.id, "weight", e.target.value) as any
                  }
                  onBlur={(e) =>
                    updateVitalSignEntry(entry.id, "weight", e.target.value) as any
                  }
                  name="weight"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-base text-black font-normal mb-2" htmlFor={`bmi-${entry.id}`}>
                  BMI
                </label>
                <input
                  id={`bmi-${entry.id}`}
                  type="text"
                  className="w-full h-14 p-3 border border-[#737373] rounded"
                  placeholder="BMI (auto-calculated)"
                  value={entry.bmi}
                  readOnly
                  name="bmi"
                />
              </div>
              <div>
                <label className="block text-base text-black font-normal mb-2" htmlFor={`painScore-${entry.id}`}>
                  Pain Score (0-10)
                </label>
                <Input
                  id={`painScore-${entry.id}`}
                  type="text"
                  className="w-full h-14 p-3 border border-[#737373] rounded"
                  placeholder="Pain Score"
                  value={entry.painScore}
                  onChange={(e) =>
                    updateVitalSignEntry(entry.id, "painScore", e.target.value) as any
                  }
                  onBlur={(e) =>
                    updateVitalSignEntry(entry.id, "painScore", e.target.value) as any
                  }
                  name="painScore"  
                />
              </div>
            </div>
          </div>
        ))}

        {/* Save button removed - form saves automatically */}
      </form>
    </div>
  );
}
import { useState } from "react";

export const Settings = () => {
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);

  return (
    <div className="flex w-full h-full justify-center">
      <div className="flex w-full max-w-[1080px] m-[16px] sm:m-[24px] flex-col">
        <div className="flex justify-between items-center mb-[12px] sm:mb-[16px] w-full border-b-2 border-black pb-[12px] sm:pb-[16px]">
          <h1 className="text-3xl font-bold">Instellingen</h1>
        </div>
        <div className="flex flex-col gap-4 py-4">
          <div className="rounded-lg border border-gray-200 p-4 bg-white shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                Automatisch synchroniseren
              </h2>
              <p className="text-gray-600 text-sm">
                Houd recepten gelijk tussen app en extensie.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAutoSyncEnabled((prev) => !prev)}
              className={`w-14 h-8 rounded-full flex items-center px-1 transition-colors ${
                autoSyncEnabled ? "bg-gray-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`h-6 w-6 rounded-full bg-white shadow transform transition-transform ${
                  autoSyncEnabled ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

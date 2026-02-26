"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

// Note: Partners can now add completely custom sports without any predefined list
// This allows for flexibility with any sport type (Karate, MMA, Yoga, etc.)

export function SportSelector({ selectedSports, onSportChange, disabled }) {
  const [currentInput, setCurrentInput] = useState("");
  const dropdownRef = useRef(null);

  // Handle sport removal
  const handleSportRemove = (sportLabel) => {
    onSportChange(selectedSports.filter((label) => label !== sportLabel));
  };

  // Handle adding custom sport
  const handleAddCustomSport = () => {
    const trimmedInput = currentInput.trim();
    if (trimmedInput && !selectedSports.includes(trimmedInput)) {
      onSportChange([...selectedSports, trimmedInput]);
      setCurrentInput("");
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && currentInput.trim()) {
      e.preventDefault();
      handleAddCustomSport();
      return;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <div className="flex flex-wrap gap-1.5 p-1 border rounded-md min-h-9 shadow-xs focus-within:ring-2 focus-within:ring-ring/50">
          {selectedSports.map((sportLabel) => (
            <div
              key={sportLabel}
              className="flex items-center gap-1 h-7 p-1 pl-2 bg-muted rounded text-sm"
            >
              <span>{sportLabel}</span>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleSportRemove(sportLabel)}
                className="size-5 hover:text-destructive"
                disabled={disabled}
              >
                <X />
              </Button>
            </div>
          ))}
          <input
            type="text"
            className="flex-1 min-w-[160px] h-7 bg-transparent outline-none px-1.5 py-1 text-sm"
            placeholder="Type sport name and press Enter (e.g., Karate, Yoga, MMA)..."
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
          />
        </div>
      </div>

      {currentInput.trim() && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 p-1 rounded-md border bg-popover shadow-lg">
          <div
            className="flex items-center justify-between px-2 py-1.5 gap-1 text-sm rounded cursor-pointer hover:bg-accent hover:text-accent-foreground"
            onClick={handleAddCustomSport}
          >
            <span>
              Press Enter to add "<strong>{currentInput.trim()}</strong>"
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

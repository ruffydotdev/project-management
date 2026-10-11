import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check, X, Users } from "lucide-react";
import styles from "./MemberSelectDropdown.module.scss";

export interface MemberOption {
  _id: string;
  name: string;
  email: string;
  department?: string;
  designation?: string;
}

interface MemberSelectDropdownProps {
  label?: string;
  options: MemberOption[];
  selectedIds: string[];
  onChange: (newSelectedIds: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const MemberSelectDropdown: React.FC<MemberSelectDropdownProps> = ({
  label = "Assign Team Members",
  options,
  selectedIds,
  onChange,
  placeholder = "Search and select team members...",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchTerm("");
    }
  }, [isOpen]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const q = searchTerm.toLowerCase();
    return options.filter(
      (opt) =>
        opt.name.toLowerCase().includes(q) ||
        opt.email.toLowerCase().includes(q) ||
        (opt.department && opt.department.toLowerCase().includes(q)) ||
        (opt.designation && opt.designation.toLowerCase().includes(q))
    );
  }, [options, searchTerm]);

  // Map of selected items for quick lookup
  const selectedMembers = useMemo(() => {
    const set = new Set(selectedIds);
    return options.filter((opt) => set.has(opt._id));
  }, [options, selectedIds]);

  const handleToggle = (id: string) => {
    if (disabled) return;
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleSelectAllFiltered = () => {
    if (disabled) return;
    const combined = Array.from(
      new Set([...selectedIds, ...filteredOptions.map((o) => o._id)])
    );
    onChange(combined);
  };

  const handleClearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  const handleRemoveSingle = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(selectedIds.filter((item) => item !== id));
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className={styles.container} ref={containerRef}>
      {label && (
        <div className={styles.label}>
          <span>{label}</span>
          <span className={styles.countBadge}>
            {selectedIds.length} assigned
          </span>
        </div>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        className={`${styles.triggerButton} ${isOpen ? styles.open : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <div className={styles.triggerContent}>
          <Users size={16} className={styles.triggerIcon} />
          {selectedIds.length === 0 ? (
            <span className={styles.triggerPlaceholder}>{placeholder}</span>
          ) : (
            <span className={styles.triggerValue}>
              {selectedIds.length === 1
                ? `${selectedMembers[0]?.name || "1 member"} assigned`
                : `${selectedIds.length} members assigned`}
            </span>
          )}
        </div>
        <ChevronDown
          size={16}
          className={`${styles.chevron} ${isOpen ? styles.rotated : ""}`}
        />
      </button>

      {/* Selected Members Pill Cloud */}
      {selectedMembers.length > 0 && (
        <div className={styles.selectedRack}>
          {selectedMembers.map((member) => (
            <span key={member._id} className={styles.selectedPill}>
              <span>{member.name}</span>
              <button
                type="button"
                className={styles.pillRemove}
                onClick={(e) => handleRemoveSingle(e, member._id)}
                title={`Remove ${member.name}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={styles.dropdownMenu}>
          {/* Search Filter Header */}
          <div className={styles.searchHeader}>
            <Search size={14} className={styles.searchIcon} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by name, email, department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            {searchTerm && (
              <button
                type="button"
                className={styles.clearSearchBtn}
                onClick={() => setSearchTerm("")}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Quick Actions Bar */}
          <div className={styles.quickActions}>
            <button
              type="button"
              className={styles.actionBtn}
              onClick={handleSelectAllFiltered}
            >
              Select All Shown ({filteredOptions.length})
            </button>
            {selectedIds.length > 0 && (
              <button
                type="button"
                className={styles.clearBtn}
                onClick={handleClearAll}
              >
                Clear Selection
              </button>
            )}
          </div>

          {/* List Options */}
          <div className={styles.optionsList}>
            {filteredOptions.length === 0 ? (
              <div className={styles.emptyState}>
                No members found matching "{searchTerm}"
              </div>
            ) : (
              filteredOptions.map((emp) => {
                const isSelected = selectedIds.includes(emp._id);
                return (
                  <div
                    key={emp._id}
                    className={`${styles.optionItem} ${
                      isSelected ? styles.selected : ""
                    }`}
                    onClick={() => handleToggle(emp._id)}
                  >
                    <div
                      className={`${styles.checkboxBox} ${
                        isSelected ? styles.checked : ""
                      }`}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>

                    <div className={styles.memberAvatar}>
                      {getInitials(emp.name)}
                    </div>

                    <div className={styles.memberMeta}>
                      <span className={styles.memberName}>{emp.name}</span>
                      <span className={styles.memberSub}>
                        {emp.department || "General"} &bull; {emp.email}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberSelectDropdown;

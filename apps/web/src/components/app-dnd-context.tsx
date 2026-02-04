
import React, { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  CollisionDetection,
  pointerWithin
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useEditorStore, SaveState, isLockedSession } from "../stores/editor-store";
import { strings } from "@notesnook/intl";
import { Tab } from "./editor/action-bar";
import { ScopedThemeProvider } from "./theme-provider";
import { Note } from "@notesnook/core";
import { db } from "../common/db";

export function AppDnDContext({ children }: { children: React.ReactNode }) {
  const {
    groups,
    tabs,
    getActiveSession
  } = useEditorStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dragType, setDragType] = useState<"tab" | "note" | null>(null);
  const [draggedNote, setDraggedNote] = useState<Note | null>(null);

  const handleDragStart = async (event: DragStartEvent) => {
    const activeId = event.active.id as string;
    setActiveDragId(activeId);

    let title = "Item";
    if (activeId.startsWith("note::")) {
      setDragType("note");
      const noteId = activeId.split("::")[1];
      const note = await db.notes.note(noteId);
      if (note) {
        setDraggedNote(note);
        title = note.title;
      }
    } else {
      setDragType("tab");
      const tab = tabs.find((t) => t && t.id === activeId);
      if (tab) {
         const session = getActiveSession(); // This might be wrong, we need session of the tab
         const actualSession = useEditorStore.getState().getSession(tab.sessionId);
         if (actualSession) title = actualSession.title || "Untitled";
      }
    }

    if (typeof IS_DESKTOP_APP !== 'undefined' && IS_DESKTOP_APP) {
      import("../common/desktop-bridge").then(({ desktop }) => {
        const themeEl = document.querySelector(".theme-scope-base") || document.documentElement;
        const style = window.getComputedStyle(themeEl);

        const bg =
          style.getPropertyValue("--background") ||
          style.backgroundColor;

        const fg =
          style.getPropertyValue("--paragraph") ||
          style.color;

        const border =
          style.getPropertyValue("--border") ||
          style.borderColor;

        // Ensure we don't end up with transparent colors if variables are missing
        const finalBg =
          bg === "transparent" || bg === "rgba(0, 0, 0, 0)" || !bg
            ? "#ffffff"
            : bg;
        const finalFg = fg || "#000000";

        desktop?.window.startDragSession.mutate({
          title,
          colors: { bg, fg: finalFg, border }
        });
      });
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    // We only handle tab reordering via drag over in the specific component (ActionBar)
    // Here we mainly ensure that we can detect groups
    // But actually, moveTab logic was in handleDragOver for tabs in the original implementation
    // to allow real-time reordering visual feedback.
    
    if (dragType === "tab") {
       // ... existing tab drag over logic ...
       // Since we moved DndContext up, we need to replicate the logic or rely on
       // SortableContext in the child components to handle the visual reordering?
       // dnd-kit's SortableContext needs to be under DndContext.
       // The original implementation had logic in handleDragOver to actually MUTATE the store.
       // "useEditorStore.getState().moveTab(activeId, targetGroupId);"
       
       const activeTab = tabs.find((t) => t && t.id === activeId);
       if (!activeTab) return;

       let targetGroupId: string | undefined;
       if (groups.some((g) => g.id === overId)) {
         targetGroupId = overId;
       } else {
         const overTab = tabs.find((t) => t && t.id === overId);
         if (overTab) targetGroupId = overTab.groupId;
       }

       if (targetGroupId && targetGroupId !== activeTab.groupId) {
         useEditorStore.getState().moveTab(activeId, targetGroupId);
       }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const activeId = active.id as string;
    setActiveDragId(null);
    setDragType(null);
    setDraggedNote(null);

    if (typeof IS_DESKTOP_APP !== 'undefined' && IS_DESKTOP_APP) {
      import("../common/desktop-bridge").then(({ desktop }) => {
        desktop?.window.endDragSession.mutate();
      });
    }
    
    // Handle Tear-out (Global for both Tabs and Notes)
    if (typeof IS_DESKTOP_APP !== 'undefined' && IS_DESKTOP_APP) {
      const activator = event.activatorEvent as MouseEvent;
      // MouseEvent might be missing on some sensors, but PointerSensor usually provides it.
       if (activator && activator.clientX !== undefined) {
          const { clientX: startX, clientY: startY } = activator;
          const { x: dx, y: dy } = event.delta;
          const finalX = startX + dx;
          const finalY = startY + dy;

          const isOutside = 
            finalX < 0 ||
            finalX > window.innerWidth ||
            finalY < 0 ||
            finalY > window.innerHeight;

          if (isOutside) {
            handleTearOut(activeId, dragType);
            return;
          }
       }
    }

    if (!over) return;
    const overId = over.id as string;

    if (dragType === "tab") {
       handleTabDragEnd(activeId, overId);
    } else if (dragType === "note") {
       handleNoteDragEnd(activeId, overId);
    }
  };

  const handleTearOut = (activeId: string, type: "tab" | "note" | null) => {
    let noteId: string | undefined;
    
    if (type === "tab") {
       const tab = tabs.find((t) => t && t.id === activeId);
       if (!tab) return;
       const session = useEditorStore.getState().getSession(tab.sessionId);
       if (session && "note" in session) noteId = session.note.id;
       else if (session && session.type === "new") {
           // Handle new note
             import("../common/desktop-bridge").then(({ desktop }) => {
                desktop?.window.open.mutate({ create: true });
                const state = useEditorStore.getState();
                // Close logic...
                state.closeTabs(activeId);
             });
             return;
       }
    } else if (type === "note") {
       noteId = activeId.split("::")[1];
    }

    if (noteId) {
       import("../common/desktop-bridge").then(({ desktop }) => {
          desktop?.window.open.mutate({ noteId });
          if (type === "tab") {
             const tab = tabs.find((t) => t && t.id === activeId);
             if (tab) useEditorStore.getState().closeTabs(activeId);
          }
       });
    }
  };

  const handleTabDragEnd = (activeId: string, overId: string) => {
     if (activeId === overId) return;
     
     // Drop Zone Logic
     if (overId.includes("::")) {
       const [groupId, position] = overId.split("::");
       if (!groupId || !position) return;
       
       const activeTab = tabs.find((t) => t && t.id === activeId);
       if (!activeTab) return;

       const direction = position === "left" || position === "right" ? "vertical" : "horizontal";
       const splitPosition = position === "left" || position === "top" ? "before" : "after";

       useEditorStore.getState().splitGroup(direction, groupId, activeTab.id, splitPosition);
       return;
     }

     // Normal reorder logic
     // ... (Already handled mostly by onDragOver for tabs, but final adjustments here)
     const activeTab = tabs.find((t) => t && t.id === activeId);
     if (!activeTab) return;

     let targetGroupId = activeTab.groupId;
     let newIndex: number | undefined;

     if (groups.some((g) => g.id === overId)) {
        targetGroupId = overId;
     } else {
        const overTab = tabs.find((t) => t && t.id === overId);
        if (overTab) {
           targetGroupId = overTab.groupId;
           const targetTabs = tabs.filter(t => t && t.groupId === targetGroupId);
           newIndex = targetTabs.findIndex(t => t.id === overId);
        }
     }
     
     useEditorStore.getState().moveTab(activeId, targetGroupId, newIndex);
  };

  const handleNoteDragEnd = async (activeId: string, overId: string) => {
    const noteId = activeId.split("::")[1];

    // Drop on drop zone (Splitting)
    if (overId.includes("::")) {
      const [groupId, position] = overId.split("::");
      if (!groupId || !position) return;

      const direction =
        position === "left" || position === "right" ? "vertical" : "horizontal";
      const splitPosition =
        position === "left" || position === "top" ? "before" : "after";

      handleNoteSplit(noteId, groupId, direction, splitPosition);
      return;
    }

    // Drop on a Group or Tab (adding to group)
    let targetGroupId: string | undefined;
    if (groups.some((g) => g.id === overId)) {
      targetGroupId = overId;
    } else {
      const overTab = tabs.find((t) => t && t.id === overId);
      if (overTab) targetGroupId = overTab.groupId;
    }

    if (targetGroupId) {
      // Open session first
      const sessionId = await useEditorStore
        .getState()
        .openSession(noteId, { openInNewTab: true });
      if (!sessionId) return;
      
      // Then find the tab and move it
      const tab = useEditorStore
        .getState()
        .tabs.find((t) => t && t.sessionId === sessionId);
      if (tab && tab.groupId !== targetGroupId) {
        useEditorStore.getState().moveTab(tab.id, targetGroupId);
      }
    }
  };

  const handleNoteSplit = async (
    noteId: string,
    _targetGroupId: string,
    direction: "vertical" | "horizontal",
    position: "before" | "after"
  ) => {
    // 1. Open note (it will likely open in active group)
    const sessionId = await useEditorStore
      .getState()
      .openSession(noteId, { openInNewTab: true });
    
    if (!sessionId) return;

    // 2. Find tab
    const tab = useEditorStore
      .getState()
      .tabs.find((t) => t && t.sessionId === sessionId);

    // 3. Perform split
    if (tab) {
      useEditorStore
        .getState()
        .splitGroup(direction, _targetGroupId, tab.id, position);
    }
  };
  
  const activeTabForOverlay = (dragType === "tab" && activeDragId)
    ? tabs.find((t) => t && t.id === activeDragId)
    : null;
  const activeSessionForOverlay = activeTabForOverlay
    ? useEditorStore.getState().getSession(activeTabForOverlay.sessionId)
    : null;

  const customCollisionDetection: CollisionDetection = (args) => {
    // 1. First, check if the pointer is strictly *inside* any droppable container
    const pointerCollisions = pointerWithin(args);

    // 2. If we found collisions with the pointer, return them.
    // This ensures that "Drop Zones" (which we want to be strict) only activate
    // when the cursor is actually inside them.
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }

    // 3. If the pointer is NOT inside any container, we might still want to
    // find the closest container for things like Tab reordering (magnetic feel).
    // EXCEPT for Drop Zones, which should effectively "disappear" if not hovered.

    // Filter out Drop Zones from the candidates
    const fallbackCandidates = args.droppableContainers.filter((container) => {
      // Assuming Drop Zones have "::" in their ID (e.g., "groupId::left")
      // and Tabs/Notes don't (or we want different behavior for them).
      // Verify this assumption with your ID naming scheme.
      return !container.id.toString().includes("::");
    });

    // 4. Run closestCenter on the filtered candidates
    return closestCenter({
      ...args,
      droppableContainers: fallbackCandidates
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={(e) => {
         // Copy cancellation logic (tear out) here too if needed
         setActiveDragId(null);
         setDragType(null);
         setDraggedNote(null);
         
         if (typeof IS_DESKTOP_APP !== 'undefined' && IS_DESKTOP_APP) {
            import("../common/desktop-bridge").then(({ desktop }) => {
              desktop?.window.endDragSession.mutate();
            });
         }
      }}
    >
      {children}
      <DragOverlay>
         {dragType === "tab" && activeTabForOverlay && activeSessionForOverlay && !(typeof IS_DESKTOP_APP !== 'undefined' && IS_DESKTOP_APP) ? (
             <ScopedThemeProvider scope="editor" sx={{ bg: "background" }}>
                <Tab
                  id={activeTabForOverlay.id}
                  title={activeSessionForOverlay.title || "Untitled"}
                  isActive={true}
                  isPinned={!!activeTabForOverlay.pinned}
                  isLocked={isLockedSession(activeSessionForOverlay)}
                  isUnsaved={activeSessionForOverlay.type === "default" && activeSessionForOverlay.saveState === SaveState.NotSaved}
                  isRevealInListDisabled={false}
                  type={activeSessionForOverlay.type}
                  onFocus={() => {}}
                  onClose={() => {}}
                  onCloseAll={() => {}}
                  onCloseOthers={() => {}}
                  onCloseToTheRight={() => {}}
                  onCloseToTheLeft={() => {}}
                  onPin={() => {}}
                  onSave={() => {}}
                />
             </ScopedThemeProvider>
         ) : null}
         {dragType === "note" && draggedNote && !(typeof IS_DESKTOP_APP !== 'undefined' && IS_DESKTOP_APP) ? (
             <ScopedThemeProvider scope="list" sx={{ bg: "background", p: 2, borderRadius: 8, boxShadow: "0 0 10px rgba(0,0,0,0.2)", width: 300 }}>
                 <div style={{fontWeight: "bold"}}>{draggedNote.title}</div>
             </ScopedThemeProvider>
         ) : null}
      </DragOverlay>
    </DndContext>
  );
}

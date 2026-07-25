
import { useDroppable } from "@dnd-kit/core";
import { Box } from "@theme-ui/components";

type DropZoneProps = {
  groupId: string;
  position: "top" | "bottom" | "left" | "right";
};

function DropZone({ groupId, position }: DropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${groupId}::${position}`,
    data: { groupId, position }
  });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        position: "absolute",
        bg: isOver ? "accent" : "transparent",
        opacity: isOver ? 0.3 : 0,
        zIndex: 10,
        transition: "all 0.2s ease-in-out",
        ...(position === "top" && {
          top: 0,
          left: 0,
          right: 0,
          height: "30%",
          borderBottom: isOver ? "2px solid var(--accent)" : "none"
        }),
        ...(position === "bottom" && {
          bottom: 0,
          left: 0,
          right: 0,
          height: "30%",
          borderTop: isOver ? "2px solid var(--accent)" : "none"
        }),
        ...(position === "left" && {
          top: 0,
          left: 0,
          bottom: 0,
          width: "30%",
          borderRight: isOver ? "2px solid var(--accent)" : "none"
        }),
        ...(position === "right" && {
          top: 0,
          right: 0,
          bottom: 0,
          width: "30%",
          borderLeft: isOver ? "2px solid var(--accent)" : "none"
        })
      }}
    />
  );
}

export function DropZoneOverlay({
  groupId,
  visible
}: {
  groupId: string;
  visible: boolean;
}) {
  if (!visible) return null;

  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
        pointerEvents: "none"
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: "100%",
          pointerEvents: "auto"
        }}
      >
        <DropZone groupId={groupId} position="top" />
        <DropZone groupId={groupId} position="bottom" />
        <DropZone groupId={groupId} position="left" />
        <DropZone groupId={groupId} position="right" />
      </Box>
    </Box>
  );
}

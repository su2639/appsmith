import type { AppState } from "@appsmith/reducers";
import { getColorWithOpacity } from "constants/DefaultTheme";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import type { CSSProperties, DragEventHandler, ReactNode } from "react";
import React, { useMemo, useRef } from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import {
  isCurrentWidgetFocused,
  isWidgetSelected,
} from "selectors/widgetSelectors";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import {
  useShowTableFilterPane,
  useWidgetDragResize,
} from "utils/hooks/dragResizeHooks";
import { getShouldAllowDrag } from "selectors/widgetDragSelectors";

const DraggableWrapper = styled.div`
  display: block;
  flex-direction: column;
  width: 100%;
  height: 100%;
  user-select: none;
  cursor: grab;
`;

type DraggableComponentProps = {
  widgetId: string;
  parentId?: string;
  isFlexChild?: boolean;
  resizeDisabled?: boolean;
  type: string;
  bottomRow: number;
  topRow: number;
  leftColumn: number;
  rightColumn: number;
  parentRowSpace: number;
  parentColumnSpace: number;
  children: ReactNode;
  dragDisabled?: boolean;
};

// Widget Boundaries which is shown to indicate the boundaries of the widget
const WidgetBoundaries = styled.div`
  z-index: 0;
  width: calc(100% + ${WIDGET_PADDING - 2}px);
  height: calc(100% + ${WIDGET_PADDING - 2}px);
  position: absolute;
  border: 1px dashed
    ${(props) => getColorWithOpacity(props.theme.colors.textAnchor, 0.5)};
  pointer-events: none;
  top: 0;
  position: absolute;
  left: 0;
`;

function DraggableComponent(props: DraggableComponentProps) {
  // Dispatch hook handy to set a widget as focused/selected
  const { focusWidget, selectWidget } = useWidgetSelection();

  const shouldAllowDrag = useSelector(getShouldAllowDrag);
  // Dispatch hook handy to set any `DraggableComponent` as dragging/ not dragging
  // The value is boolean
  const { setDraggingState } = useWidgetDragResize();
  const showTableFilterPane = useShowTableFilterPane();

  const isSelected = useSelector(isWidgetSelected(props.widgetId));
  // This state tels us which widget is focused
  // The value is the widgetId of the focused widget.
  const isFocused = useSelector(isCurrentWidgetFocused(props.widgetId));

  // This state tells us whether a `ResizableComponent` is resizing
  const isResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isResizing,
  );

  // This state tells us whether a `DraggableComponent` is dragging
  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );

  const isDraggingSibling = useSelector(
    (state) =>
      state.ui.widgetDragResize?.dragDetails?.draggedOn === props.parentId,
  );

  // True when any widget is dragging or resizing, including this one
  const isResizingOrDragging = !!isResizing || !!isDragging;
  const isCurrentWidgetDragging = isDragging && isSelected;
  const isCurrentWidgetResizing = isResizing && isSelected;
  const showBoundary =
    !props.isFlexChild && (isCurrentWidgetDragging || isDraggingSibling);

  // When mouse is over this draggable
  const handleMouseOver = (e: any) => {
    focusWidget &&
      !isResizingOrDragging &&
      !isFocused &&
      !props.resizeDisabled &&
      focusWidget(props.widgetId);
    e.stopPropagation();
  };

  // Display this draggable based on the current drag state
  const dragWrapperStyle: CSSProperties = {
    display: !props.isFlexChild && isCurrentWidgetDragging ? "none" : "block",
  };
  const dragBoundariesStyle: React.CSSProperties = useMemo(() => {
    return {
      opacity: !isResizingOrDragging || isCurrentWidgetResizing ? 0 : 1,
    };
  }, [isResizingOrDragging, isCurrentWidgetResizing]);

  const classNameForTesting = `t--draggable-${props.type
    .split("_")
    .join("")
    .toLowerCase()}`;

  const allowDrag = !props?.dragDisabled && shouldAllowDrag;
  const className = `${classNameForTesting}`;
  const draggableRef = useRef<HTMLDivElement>(null);
  const onDragStart: DragEventHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // allowDrag check is added as react jest test simulation is not respecting default behaviour
    // of draggable=false and triggering onDragStart. allowDrag condition check is purely for the test cases.
    if (allowDrag && draggableRef.current && !(e.metaKey || e.ctrlKey)) {
      if (!isFocused) return;

      if (!isSelected) {
        selectWidget(SelectionRequestType.One, [props.widgetId]);
      }
      const widgetHeight = props.bottomRow - props.topRow;
      const widgetWidth = props.rightColumn - props.leftColumn;
      const bounds = draggableRef.current.getBoundingClientRect();
      const startPoints = {
        top: Math.min(
          Math.max((e.clientY - bounds.top) / props.parentRowSpace, 0),
          widgetHeight - 1,
        ),
        left: Math.min(
          Math.max((e.clientX - bounds.left) / props.parentColumnSpace, 0),
          widgetWidth - 1,
        ),
      };
      showTableFilterPane();
      setDraggingState({
        isDragging: true,
        dragGroupActualParent: props.parentId || "",
        draggingGroupCenter: { widgetId: props.widgetId },
        startPoints,
        draggedOn: props.parentId,
      });
    }
  };

  return (
    <DraggableWrapper
      className={className}
      data-testid={isSelected ? "t--selected" : ""}
      draggable={allowDrag}
      onDragStart={onDragStart}
      onMouseOver={handleMouseOver}
      ref={draggableRef}
      style={dragWrapperStyle}
    >
      {props.children}
      {showBoundary && (
        <WidgetBoundaries
          className={`widget-boundary-${props.widgetId}`}
          style={dragBoundariesStyle}
        />
      )}
    </DraggableWrapper>
  );
}

export default DraggableComponent;

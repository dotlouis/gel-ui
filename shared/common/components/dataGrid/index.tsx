import {PropsWithChildren, useEffect, useRef, useState} from "react";
import {observer} from "mobx-react-lite";

import cn from "@edgedb/common/utils/classNames";

import {useResize} from "../../hooks/useResize";
import {CustomScrollbars} from "../../ui/customScrollbar";

import {DataGridState, DefaultColumnWidth} from "./state";

import styles from "./dataGrid.module.scss";
import {useGlobalDragCursor} from "../../hooks/globalDragCursor";

export interface DataGridProps {
  state: DataGridState;
}

export function DataGrid({state, children}: PropsWithChildren<DataGridProps>) {
  const ref = useRef<HTMLDivElement | null>(null);

  useResize(ref, ({width, height}) =>
    state.setGridContainerSize(width, height)
  );

  useEffect(() => {
    const container = state.gridElRef;

    if (container) {
      const listener = () => {
        state.updateScrollPos(container.scrollTop, container.scrollLeft);
      };

      container.addEventListener("scroll", listener);

      return () => {
        container.removeEventListener("scroll", listener);
      };
    }
  }, [state.gridElRef]);

  return (
    <CustomScrollbars
      className={styles.scrollbarWrapper}
      innerClass={styles.innerWrapper}
      headerPadding={state.headerHeight}
    >
      <div
        ref={(el) => {
          state.gridElRef = el;
          ref.current = el;
          if (el) {
            el.scrollTop = state.scrollPos.top;
            el.scrollLeft = state.scrollPos.left;
          }
        }}
        className={styles.dataGrid}
      >
        <div className={styles.innerWrapper}>{children}</div>
      </div>
    </CustomScrollbars>
  );
}

export const GridHeaders = observer(function GridHeaders({
  className,
  state,
  pinnedHeaders,
  headers,
}: {
  className?: string;
  state: DataGridState;
  pinnedHeaders: React.ReactNode;
  headers: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useResize(ref, ({height}) => state.setHeaderHeight(height));

  return (
    <div
      ref={ref}
      className={cn(styles.headers, className)}
      style={{
        gridTemplateColumns: `${
          state.pinnedColsWidth ? `${state.pinnedColsWidth}px ` : ""
        }${state.colWidths.join("px ")}px minmax(100px, 1fr)`,
      }}
    >
      {state.pinnedColWidths.length ? (
        <div
          className={cn(styles.pinnedHeaders, className)}
          style={{
            gridTemplateColumns: `${
              state.pinnedColWidths.join("px ") || "0"
            }px`,
          }}
        >
          {pinnedHeaders}
        </div>
      ) : null}
      {headers}
    </div>
  );
});

export function HeaderResizeHandle({
  className,
  state,
  columnId,
  style,
}: {
  className?: string;
  state: DataGridState;
  columnId: string;
  style?: React.CSSProperties;
}) {
  const [_, setGlobalDrag] = useGlobalDragCursor();
  const [dragging, setDragging] = useState(false);

  return (
    <div
      className={cn(styles.resizeHandle, className, {
        [styles.dragging]: dragging,
      })}
      style={style}
      onMouseDown={(e) => {
        const startMouseLeft = e.clientX;
        const startColWidth =
          state._colWidths.get(columnId) ?? DefaultColumnWidth;
        const moveListener = (e: MouseEvent) => {
          state.setColWidth(
            columnId,
            e.clientX - startMouseLeft + startColWidth
          );
        };
        setGlobalDrag("col-resize");
        setDragging(true);

        window.addEventListener("mousemove", moveListener);
        window.addEventListener(
          "mouseup",
          () => {
            window.removeEventListener("mousemove", moveListener);
            setGlobalDrag(null);
            setDragging(false);
            state.onColumnResizeComplete?.(state._colWidths);
          },
          {once: true}
        );
      }}
    />
  );
}

export const GridContent = observer(function GridContent({
  className,
  style,
  state,
  pinnedCells,
  cells,
}: {
  className?: string;
  style?: React.CSSProperties;
  state: DataGridState;
  pinnedCells?: React.ReactNode;
  cells: React.ReactNode;
}) {
  return (
    <div
      className={cn(styles.gridContent, className)}
      style={{
        ...style,
        height: state.gridContentHeight,
        width: state.gridContentWidth,
      }}
    >
      {pinnedCells ? (
        <div
          className={styles.pinnedContent}
          style={{width: state.pinnedColsWidth}}
        >
          {pinnedCells}
        </div>
      ) : null}
      {cells}
    </div>
  );
});

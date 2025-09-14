import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { PanGestureHandler, State, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Svg, { Path } from 'react-native-svg';

interface DrawingCanvasProps {
  style?: any;
  onDrawingChange?: (isDrawing: boolean) => void;
  disabled?: boolean;
  paths?: string[];
  onPathsChange?: (paths: string[]) => void;
  isMultiplayer?: boolean;
}

interface Point {
  x: number;
  y: number;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ 
  style, 
  onDrawingChange, 
  disabled, 
  paths: externalPaths,
  onPathsChange,
  isMultiplayer = false 
}) => {
  const [internalPaths, setInternalPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPoint = useRef<Point | null>(null);
  const updateTimeout = useRef<NodeJS.Timeout | null>(null);

  // Use external paths for multiplayer, internal paths for single player
  const paths = isMultiplayer ? (externalPaths || []) : internalPaths;

  // Throttled update function for real-time drawing
  const throttledUpdate = useCallback((newPaths: string[]) => {
    if (updateTimeout.current) {
      clearTimeout(updateTimeout.current);
    }
    updateTimeout.current = setTimeout(() => {
      onPathsChange?.(newPaths);
    }, 50); // Update every 50ms
  }, [onPathsChange]);

  const createPath = (points: Point[]): string => {
    if (points.length === 0) return '';
    
    let path = `M${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L${points[i].x},${points[i].y}`;
    }
    return path;
  };

  const onGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    if (disabled) return;
    
    const { x, y, state } = event.nativeEvent;
    const point = { x, y };

    switch (state) {
      case State.BEGAN:
        setIsDrawing(true);
        onDrawingChange?.(true);
        setCurrentPath(`M${x},${y}`);
        lastPoint.current = point;
        break;

      case State.ACTIVE:
        if (lastPoint.current) {
          const newPath = currentPath + ` L${x},${y}`;
          setCurrentPath(newPath);
          lastPoint.current = point;
          
          // Send real-time updates during drawing for multiplayer
          if (isMultiplayer) {
            const tempPaths = [...paths, newPath];
            throttledUpdate(tempPaths);
          }
        }
        break;

      case State.END:
      case State.CANCELLED:
        setIsDrawing(false);
        onDrawingChange?.(false);
        if (currentPath) {
          const newPaths = [...paths, currentPath];
          if (isMultiplayer) {
            onPathsChange?.(newPaths);
          } else {
            setInternalPaths(newPaths);
          }
          setCurrentPath('');
        }
        lastPoint.current = null;
        break;
    }
  };

  const clearCanvas = () => {
    const newPaths: string[] = [];
    if (isMultiplayer) {
      onPathsChange?.(newPaths);
    } else {
      setInternalPaths(newPaths);
    }
    setCurrentPath('');
    setIsDrawing(false);
    onDrawingChange?.(false);
    
    // Clear any pending updates
    if (updateTimeout.current) {
      clearTimeout(updateTimeout.current);
      updateTimeout.current = null;
    }
  };

  const undoLastPath = () => {
    const newPaths = paths.slice(0, -1);
    if (isMultiplayer) {
      onPathsChange?.(newPaths);
    } else {
      setInternalPaths(newPaths);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onGestureEvent}
        minDist={1}
      >
        <View style={styles.canvas}>
          <Svg style={StyleSheet.absoluteFill}>
            {paths.map((path, index) => (
              <Path
                key={index}
                d={path}
                stroke="#000000"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ))}
            {currentPath && (
              <Path
                d={currentPath}
                stroke="#000000"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            )}
          </Svg>
        </View>
      </PanGestureHandler>

      {!disabled && ( 
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton} onPress={undoLastPath}>
            <Text style={styles.controlText}>↶ Undo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={clearCanvas}>
            <Text style={styles.controlText}>🗑️ Clear</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  canvas: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  controlButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  controlText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default DrawingCanvas;

/**
 * 用于标注查看模式
 * @author laoluo
 */

import React, { useEffect, useRef, useImperativeHandle, useState } from 'react';
import { ViewOperation, ImgUtils } from '@sensetime/annotation';
import { Spin } from 'antd';

interface IProps {
  size: {
    width: number;
    height: number;
  };
  src: string; // 图片路径
  style: {
    color?: string;
    fill?: string;
  };
  annotations: any[]; // TODO
  zoomChange?: (zoom: number) => void;
  backgroundStyle: React.CSSProperties;
  onChange?: (type: 'hover' | 'selected', ids: string[]) => void;

  showLoading?: boolean;
}

const DEFAULT_SIZE = {
  width: 500,
  height: 400,
};

const AnnotationView = (props: IProps, ref: any) => {
  const {
    size = DEFAULT_SIZE,
    src,
    annotations = [],
    style = {
      color: 'blue',
      thickness: 5,
    },
    zoomChange,
    backgroundStyle = {},
    onChange,
    showLoading = false,
  } = props;
  const [loading, setLoading] = useState(false);
  const annotationRef = useRef<HTMLDivElement>(null);
  const viewOperation = useRef<ViewOperation>();

  useImperativeHandle(
    ref,
    () => {
      const toolInstance = viewOperation.current;
      if (!toolInstance) {
        return {};
      }

      return {
        zoomIn: () => toolInstance.zoomChanged(true), // 放大
        zoomOut: () => toolInstance.zoomChanged(false), // 缩小
        initImgPos: () => toolInstance.initImgPos(),
        toolInstance,
      };
    },
    [viewOperation.current],
  );

  useEffect(() => {
    if (annotationRef.current) {
      viewOperation.current = new ViewOperation({
        container: annotationRef.current,
        size,
        style,
        annotations,
        config: '{}' // TODO，暂时不需要
      });

      const toolInstance = viewOperation.current;
      viewOperation.current.init();
    }

    return () => {
      viewOperation.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (viewOperation.current) {
      setLoading(true);
      viewOperation.current?.setLoading(true);
      ImgUtils.load(src)
        .then((imgNode: HTMLImageElement) => {
          viewOperation.current?.setLoading(false);
          setLoading(false);

          viewOperation.current?.setImgNode(imgNode);
        })
        .catch(() => {
          viewOperation.current?.setLoading(false);
          setLoading(false);
        });
    }
  }, [src]);

  /**
   * 基础数据绘制监听
   */
  useEffect(() => {
    if (viewOperation.current) {
      console.error(2);

      viewOperation.current.updateData(annotations);
    }
  }, [annotations]);

  /** 窗口大小监听 */
  useEffect(() => {
    const toolInstance = viewOperation.current;

    if (toolInstance?.setSize) {
      toolInstance.setSize(size);
    }
  }, [size?.width, size?.height]);

  useEffect(() => {
    if (viewOperation.current) {
      viewOperation.current?.on('onChange', (...args: any) => {
        onChange?.apply(null, args);
      });

      viewOperation.current?.on('renderZoom', (zoom: number) => {
        if (zoomChange) {
          zoomChange(zoom);
        }
      });
    }
    return () => {
      viewOperation.current?.unbindAll('onChange');
      viewOperation.current?.unbindAll('renderZoom');
    };
  }, [zoomChange, onChange]);

  const mainRender = <div ref={annotationRef} style={{ ...size, ...backgroundStyle }} />;

  if (showLoading) {
  }
  return <Spin spinning={showLoading || loading} delay={300}>{mainRender}</Spin>;

  // return mainRender;
};

export default React.forwardRef(AnnotationView);

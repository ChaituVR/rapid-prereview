import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import throttle from 'lodash/throttle';
import { Document, Page } from 'react-pdf/dist/entry.webpack'; // load as a web worker

/**
 * Fallback for `object` as on mobile <object /> doesn't work
 *
 * This implement an infinite scroll mechanism so that we never load more than a
 * few pages at the time
 */
export default function PdfViewer({ pdfUrl }) {
  const [width, setWidth] = useState(getWidth());
  const [focused, setFocused] = useState(0);
  const [dims, setDims] = useState([]);

  useEffect(() => {
    const throttled = throttle(
      function handleResize(e) {
        const nextWidth = getWidth();
        setWidth(nextWidth);

        const bottomScroll = window.scrollY + window.innerHeight;
        setFocused(findFocused(bottomScroll, dims, nextWidth));
      },
      150,
      {
        trailing: true,
        leading: false
      }
    );

    window.addEventListener('resize', throttled);
    return () => {
      throttled.cancel();
      window.removeEventListener('resize', throttled);
    };
  }, [dims, width]);

  useEffect(() => {
    function handleScroll(e) {
      const bottomScroll = window.scrollY + window.innerHeight;

      const nextFocused = findFocused(bottomScroll, dims, width);
      if (focused !== nextFocused) {
        setFocused(nextFocused);
      }
    }

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [focused, dims, width]);

  const isMountedRef = useRef(false);
  useEffect(() => {
    isMountedRef.current = true;
    () => {
      isMountedRef.current = false;
    };
  });

  return (
    <div className="pdf-viewer">
      <Document
        file={`${process.env.API_URL}/api/pdf?url=${encodeURIComponent(
          pdfUrl
        )}`}
        onLoadSuccess={async pdf => {
          let dims = [];
          for (let i = 0; i < pdf.numPages; i++) {
            const page = await pdf.getPage(i + 1);
            const [, , w, h] = page.view;

            dims.push({ w, h });
          }
          if (isMountedRef.current) {
            setDims(dims);
          }
        }}
      >
        {dims.map((dim, i) =>
          i === focused || i - 1 === focused || i + 1 === focused ? (
            <Page
              key={i}
              width={width}
              loading={
                <VirtualPage
                  height={getScaledPageHeight({
                    desiredWidth: width,
                    nativeWidth: dim.w,
                    nativeHeight: dim.h
                  })}
                />
              }
              pageNumber={i + 1}
              renderAnnotationLayer={false}
            />
          ) : (
            <VirtualPage
              key={i}
              height={getScaledPageHeight({
                desiredWidth: width,
                nativeWidth: dim.w,
                nativeHeight: dim.h
              })}
            />
          )
        )}
      </Document>
    </div>
  );
}

PdfViewer.propTypes = {
  pdfUrl: PropTypes.string.isRequired
};

function getWidth() {
  return Math.min(window.innerWidth, 900);
}

function getScaledPageHeight({ desiredWidth, nativeWidth, nativeHeight }) {
  return (desiredWidth * nativeHeight) / nativeWidth;
}

function findFocused(bottomScroll, dims, desiredWidth) {
  let i = 0;
  let cum = getScaledPageHeight({
    desiredWidth,
    nativeWidth: dims[0].w,
    nativeHeight: dims[0].h
  });
  while (bottomScroll > cum) {
    i++;
    cum += getScaledPageHeight({
      desiredWidth,
      nativeWidth: dims[i].w,
      nativeHeight: dims[i].h
    });
  }

  return Math.min(i, dims.length - 1);
}

function VirtualPage({ height }) {
  return (
    <div className="pdf-viewer__fake-page" style={{ height: `${height}px` }} />
  );
}
VirtualPage.propTypes = {
  height: PropTypes.number
};

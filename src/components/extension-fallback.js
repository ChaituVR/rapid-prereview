import React, { Suspense, useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import mobile from 'is-mobile';
import { usePreprint } from '../hooks/api-hooks';
import { getPdfUrl, getCanonicalUrl } from '../utils/preprints';
import Shell from './shell';
import ShellContent from './shell-content';
import NotFound from './not-found';
import SuspenseLoading from './suspense-loading';

const PdfViewer = React.lazy(() =>
  import(/* webpackChunkName: "pdf-viewer" */ './pdf-viewer')
);

// TODO if no PDF is available display shell in full screen ?

export default function ExtensionFallback() {
  const location = useLocation(); // location.state can be {preprint, tab} with tab being `request` or `review` (so that we know on which tab the shell should be activated with
  const { identifierPart1, identifierPart2 } = useParams();
  const identifier = [identifierPart1, identifierPart2]
    .filter(Boolean)
    .join('/');

  const isMobile = useMemo(() => mobile({ tablet: true }), []);

  const [preprint, fetchPreprintProgress] = usePreprint(
    identifier,
    location.state && location.state.preprint
  );

  if (
    fetchPreprintProgress.error &&
    fetchPreprintProgress.error.statusCode >= 400
  ) {
    return <NotFound />;
  }

  const pdfUrl = getPdfUrl(preprint);
  const canonicalUrl = getCanonicalUrl(preprint);

  return (
    <div className="extension-fallback">
      <Helmet>
        <title>Rapid PREreview • {identifier}</title>
      </Helmet>

      {pdfUrl ? (
        isMobile ? (
          /* for mobile devices we always use the fallback */
          <Suspense fallback={<SuspenseLoading>Loading PDF</SuspenseLoading>}>
            <PdfViewer
              pdfUrl={pdfUrl}
              loading={<SuspenseLoading>Loading PDF</SuspenseLoading>}
            />
          </Suspense>
        ) : (
          <object
            key={pdfUrl}
            data={pdfUrl}
            // type="application/pdf" commented out as it seems to break pdf loading in safari
            // typemustmatch="true" commented out as it doesn't seem to be currently supported by react
          >
            {/* fallback text in case we can't load the PDF */}
            <Suspense fallback={<SuspenseLoading>Loading PDF</SuspenseLoading>}>
              <PdfViewer
                pdfUrl={pdfUrl}
                loading={<SuspenseLoading>Loading PDF</SuspenseLoading>}
              />
            </Suspense>
          </object>
        )
      ) : preprint && !pdfUrl && !fetchPreprintProgress.isActive ? (
        <div className="extension-fallback__no-pdf-message">
          <div>
            No PDF available.
            {!!canonicalUrl && (
              <span>
                {` `}You can visit{' '}
                {
                  <a
                    href={canonicalUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    {canonicalUrl}
                  </a>
                }{' '}
                for more information on the document.
              </span>
            )}
          </div>
        </div>
      ) : null}

      <Shell>
        {onRequireScreen =>
          !!preprint && (
            <ShellContent
              onRequireScreen={onRequireScreen}
              preprint={preprint}
              defaultTab={location.state && location.state.tab}
            />
          )
        }
      </Shell>
    </div>
  );
}

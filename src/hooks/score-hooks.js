import { useMemo, useState, useEffect, useCallback } from 'react';

/**
 * Note actions should always have a length of at least 1 as only preprint
 * with reviews or requests for reviews are listed
 */
export function useAnimatedScore(actions, now = new Date().toISOString()) {
  const sorted = useMemo(() => {
    return actions.slice().sort((a, b) => {
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });
  }, [actions]);

  const [index, setIndex] = useState(null);

  const tmin = new Date(sorted[0].startTime).getTime();
  const tmax = Math.max(
    new Date(now).getTime(),
    new Date(sorted[sorted.length - 1].startTime).getTime()
  );

  // if all the actions are at the beginning and long past, the animation is
  // going to be ugly with all the number changing without the circle growing
  // => In those case we just pretent that all the actions were posted regularly
  // and one after another
  const prettify =
    new Date(now).getTime() -
      new Date(sorted[sorted.length - 1].startTime).getTime() >
    2 *
      (new Date(sorted[sorted.length - 1].startTime).getTime() -
        new Date(sorted[0].startTime).getTime());

  useEffect(() => {
    if (index !== null && index < sorted.length) {
      const totalAnimTime = Math.min(sorted.length * 100, 500);

      let timeout;
      if (prettify) {
        timeout = totalAnimTime / sorted.length;
      } else if (sorted.length > 1) {
        const t = new Date(sorted[Math.max(index - 1, 0)].startTime).getTime();
        const nextT = new Date(
          index >= sorted.length - 1
            ? now
            : sorted[Math.max(index, 0)].startTime
        ).getTime();

        const rT = ((t - tmin) / (tmax - tmin)) * totalAnimTime;
        const rNextT = ((nextT - tmin) / (tmax - tmin)) * totalAnimTime;
        timeout = rNextT - rT;
      } else {
        timeout = totalAnimTime;
      }

      const timeoutId = setTimeout(() => {
        setIndex(index + 1);
      }, timeout);

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [index, sorted, tmin, tmax, now, prettify]);

  const handleStartAnim = useCallback(
    function handleStartAnim() {
      if (sorted.length > 1) {
        setIndex(-1);
      }
    },
    [sorted]
  );
  const handleStopAnim = useCallback(function handleStopAnim() {
    setIndex(null);
  }, []);

  const nRequests =
    index === -1
      ? 0
      : getNRequests(
          sorted.slice(
            0,
            index === null || index >= sorted.length ? sorted.length : index + 1
          )
        );
  const nReviews =
    index === -1
      ? 0
      : getNReviews(
          sorted.slice(
            0,
            index === null || index >= sorted.length ? sorted.length : index + 1
          )
        );

  let playedTime;
  if (index === null || index >= sorted.length) {
    playedTime = now;
  } else if (index === -1) {
    playedTime = sorted[0] && sorted[0].startTime;
  } else if (prettify) {
    playedTime = new Date(
      (index / (sorted.length - 1)) * (tmax - tmin) + tmin
    ).toISOString();
  } else {
    playedTime = sorted[index].startTime;
  }

  return {
    nRequests,
    nReviews,
    now: playedTime,
    dateFirstActivity: sorted[0] && sorted[0].startTime,
    onStartAnim: handleStartAnim,
    onStopAnim: handleStopAnim
  };
}

function getNReviews(actions) {
  return actions.reduce((count, action) => {
    if (action['@type'] === 'RapidPREreviewAction') {
      count++;
    }
    return count;
  }, 0);
}

function getNRequests(actions) {
  return actions.reduce((count, action) => {
    if (action['@type'] === 'RequestForRapidPREreviewAction') {
      count++;
    }
    return count;
  }, 0);
}

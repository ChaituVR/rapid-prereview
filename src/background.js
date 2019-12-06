import {
  CHECK_SESSION_COOKIE,
  SESSION_COOKIE,
  SESSION_COOKIE_CHANGED,
  HISTORY_STATE_UPDATED
} from './constants';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === CHECK_SESSION_COOKIE) {
    chrome.cookies.get(
      {
        url: process.env.COOKIE_URL,
        name: 'rapid.sid'
      },
      cookie => {
        sendResponse({
          type: SESSION_COOKIE,
          payload: cookie
        });
      }
    );

    return true;
  }
});

// if user login we notify all the tabs so the shell is updated
chrome.cookies.onChanged.addListener(changeInfo => {
  if (
    changeInfo.cookie.name === 'rapid.sid' &&
    changeInfo.cookie.domain === new URL(process.env.COOKIE_URL).hostname
  ) {
    chrome.tabs.query({}, tabs => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          type: SESSION_COOKIE_CHANGED,
          payload: changeInfo
        });
      });
    });
  }
});

// communicate with content-script:
// - Keep icon badge text (counter) up-to-date
// - Broadcast HistoryStateUpdated
chrome.runtime.onConnect.addListener(port => {
  function handleHistoryStateUpdated(data) {
    port.postMessage({ type: HISTORY_STATE_UPDATED, payload: data });
  }

  if (port.name === 'stats') {
    port.onDisconnect.addListener(data => {
      chrome.webNavigation.onHistoryStateUpdated.removeListener(
        handleHistoryStateUpdated
      );
    });

    chrome.webNavigation.onHistoryStateUpdated.addListener(
      handleHistoryStateUpdated,
      {
        url: [{ urlContains: process.env.API_URL }]
      }
    );

    port.onMessage.addListener((msg, port) => {
      switch (msg.type) {
        case 'STATS':
          chrome.browserAction.setBadgeText({
            text:
              msg.payload === null
                ? ''
                : (msg.payload.nReviews + msg.payload.nRequests).toString(),
            tabId: port.sender.tab.id
          });
          break;

        case 'HAS_GSCHOLAR':
          chrome.browserAction.setIcon({
            path: msg.payload.hasGsholar
              ? {
                  '16': './icons/app-icon--active@16px.png',
                  '24': './icons/app-icon--active@1x.png',
                  '32': './icons/app-icon--active@1.5x.png',
                  '48': './icons/app-icon--active@2x.png'
                }
              : {
                  '16': './icons/app-icon--inactive@16px.png',
                  '24': './icons/app-icon--inactive@1x.png',
                  '32': './icons/app-icon--inactive@1.5x.png',
                  '48': './icons/app-icon--inactive@2x.png'
                },
            tabId: port.sender.tab.id
          });

          chrome.browserAction.setBadgeBackgroundColor({
            color: msg.payload.hasGscholar ? '#ff3333' : 'gray',
            tabId: port.sender.tab.id
          });
          break;

        default:
          break;
      }
    });
  }
});

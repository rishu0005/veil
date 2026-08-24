function isUrl(query) {

    query = query.trim();

    // Already has a protocol
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(query)) {
        return true;
    }

    // localhost
    if (/^localhost(?::\d+)?(?:\/.*)?$/i.test(query)) {
        return true;
    }

    // IPv4 address
    if (
        /^(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?(?:\/.*)?$/.test(query)
    ) {
        return true;
    }

    // Domain name
    if (
        /^(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d+)?(?:\/.*)?$/i.test(query)
    ) {
        return true;
    }

    return false;
}

function openUrl(query){
      let url = query;

          if (!/^https?:\/\//i.test(url)) {
              url = "https://" + url;
          }
          console.log(url);
          window.location.href = url;
          return;
}

export {isUrl, openUrl}
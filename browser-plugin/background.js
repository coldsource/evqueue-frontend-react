function openPage() {
  browser.tabs.create({
    url: "/htdocs/index.html"
  });
}

browser.browserAction.onClicked.addListener(openPage); 

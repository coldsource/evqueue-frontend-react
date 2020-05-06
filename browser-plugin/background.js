browser.browserAction.onClicked.addListener(() => {
  browser.tabs.create({
    url: "/htdocs/index.html"
  });
}); 

browser.runtime.onInstalled.addListener(() => {
	browser.storage.local.get().then( (data) => {
		console.log(data);
		if(data.clusters===undefined)
		{
			browser.tabs.create({
				url: "/htdocs/index.html?loc=settings"
			});
		}
	});
});

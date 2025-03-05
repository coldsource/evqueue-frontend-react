if(browser === undefined)
{
	var browser = chrome;
	
	function lsget(key) {
		return new Promise((resolve, reject) => {
			chrome.storage.local.get(key, (data) => {
				resolve(data);
			});
		});
	}
}
else
	var lsget = browser.storage.local.get;

browser.action.onClicked.addListener(() => {
	browser.tabs.create({
		url: "/htdocs/index.html"
	});
}); 

browser.runtime.onInstalled.addListener(() => {
	lsget('clusters').then( (data) => {
		if(data.clusters===undefined)
		{
			browser.tabs.create({
				url: "/htdocs/index.html?loc=settings"
			});
		}
	});
});

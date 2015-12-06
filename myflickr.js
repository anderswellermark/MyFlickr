var MyFlickr = function MyFlickr(API_KEY) {	
	
	MyFlickr.API_KEY = API_KEY;
	MyFlickr.PHOTOS_SEARCH_URL_TEMPLATE = "https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=" + MyFlickr.API_KEY + "&page={page-number}&tags={search-string}&extras=url_o%2Curl_t&format=json&nojsoncallback=1";
	MyFlickr.GALLERY_ITEM_TEMPLATE = "<a onclick=\"MyFlickr.gallerySelected(this)\">{gallery-name}</a>";
	MyFlickr.PHOTO_TEMPLATE = "<img src=\"{image-url}\" id=\"{image-id}\" onclick=\"MyFlickr.toggleSelectPicture(this)\" ondblclick=\"MyFlickr.toggleBigPicture(this, true)\" />";
	MyFlickr.BIG_PICTURE_URL_TEMPLATE = "http://farm{farm-id}.staticflickr.com/{server-id}/{id}_{secret}_b.jpg";
	MyFlickr.currentQuery = [];
	MyFlickr.pagesLoaded = 0;
	MyFlickr.galleries = [{
		name: "Demogalleri",
		photos: []
	}];
	
	MyFlickr.initialize = function() {
		document.addEventListener("DOMContentLoaded", function(event) { 
			MyFlickr.initializeEventListeners();
			MyFlickr.renderGalleries();
			MyFlickr.renderAddToGallery();
		});
	};
	
	MyFlickr.initializeEventListeners = function() {
		var searchField = document.getElementById("search-field");
		searchField.addEventListener("keyup", function(e) {
			if(e.keyCode == 13) {
				MyFlickr.search(searchField, 1);
			}
		});
		document.getElementById("gallerys-btn").addEventListener("click", function(e) {
			document.getElementById("gallerys-dropbtn").classList.toggle("show");
		});
		window.onclick = function(event) {
			if (!event.target.matches('.dropbtn') && event.target.id !== "new-gallery-name-field" && event.target.id !== "new-gallery-create-btn") {
				var dropdowns = document.getElementsByClassName("dropdown-content");
				for (var i = 0; i < dropdowns.length; i++) {
					var openDropdown = dropdowns[i];
					if (openDropdown.classList.contains('show')) {
						openDropdown.classList.remove('show');
					}
				}
			}
		};
		document.getElementById("new-gallery-create-btn").addEventListener("click", function(e) {
			var newGalleryField = document.getElementById("new-gallery-name-field");
			if(newGalleryField.value.length > 0 && MyFlickr.getGalleryByName(newGalleryField.value) === undefined) {
				MyFlickr.galleries.push({
					name: newGalleryField.value,
					photos: []
				});
				newGalleryField.value = "";
				MyFlickr.renderGalleries();
				MyFlickr.renderAddToGallery();
			}
		});
		document.getElementById("imageviewer").addEventListener("click", function(e) {
			MyFlickr.toggleBigPicture(null, false);
		});
		window.onscroll = function(ev) {
			if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
				MyFlickr.search(document.getElementById("search-field"), MyFlickr.pagesLoaded + 1);
			}
		};
	};
	
	MyFlickr.search = function(searchField, page) {
		if(MyFlickr.isGalleryView()) {
			var gallery = MyFlickr.getGalleryByName(MyFlickr.getCurrentGalleryName());
			if(gallery !== undefined) {
				MyFlickr.renderSearchResult(gallery.photos, false);
			}
		} else {
			var loader = document.getElementById("search-loading");
			loader.style.display = "inline";
			var url = MyFlickr.PHOTOS_SEARCH_URL_TEMPLATE
					.replace("{search-string}", searchField.value)
					.replace("{page-number}", page);
			MyFlickr.getJson({
				url: url,
				success: function(data) {
					if(page == 1) {
						MyFlickr.deselectAllPictures();
						MyFlickr.renderAddToGallery();
						MyFlickr.pagesLoaded = 1;
						MyFlickr.currentQuery = [];
					} else {
						MyFlickr.pagesLoaded++;
					}
					if(data.photos !== undefined) {
						MyFlickr.currentQuery.push(data);
						MyFlickr.renderSearchResult(data.photos.photo, page > 1);
					}
					loader.style.display = "none";
				},
				error: function(request) {
					loader.style.display = "none";
					console.log("ERROR:");
					console.log(request);
				}
			});
		}
	};
	
	MyFlickr.getCurrentGalleryName = function() {
		if(MyFlickr.isGalleryView()) {
			var searchField = document.getElementById("search-field"); 
			return searchField.value.substring(9, searchField.value.length);
		} else {
			return undefined;
		}
	};
	
	MyFlickr.getGalleryByName = function(name) {
		var result;
		for(var i=0; i < MyFlickr.galleries.length; i++) {
			if(MyFlickr.galleries[i].name === name) {
				result = MyFlickr.galleries[i]; 
			}
		}
		return result;
	};
	
	MyFlickr.getPictureById = function(id) {
		var result;
		for(var i=0; i < MyFlickr.currentQuery.length; i++) {
			for(var ii=0; ii < MyFlickr.currentQuery[i].photos.photo.length; ii++) {
				if(MyFlickr.currentQuery[i].photos.photo[ii].id === id) {
					result = MyFlickr.currentQuery[i].photos.photo[ii]; 
				}
			}
		}
		return result;
	};
	
	MyFlickr.getPictureInCurrentGallery = function(id) {
		var gallery = MyFlickr.getGalleryByName(MyFlickr.getCurrentGalleryName());
		var result;
		for(var i=0; i < gallery.photos.length; i++) {
			if(gallery.photos[i].id === id) {
				result = gallery.photos[i];
			}
		}
		return result;
	};
	
	MyFlickr.toggleSelectPicture = function(element) {
		if(element.className === "selected") {
			element.className = "";
		} else {
			element.className = "selected";
		}
		MyFlickr.renderAddToGallery();
	};
	
	MyFlickr.deselectAllPictures = function() {
		var pics = document.getElementById("search-result").children;
		for(var i=0; i < pics.length; i++) {
			pics[i].className = "";
		}
	};
	
	MyFlickr.isGalleryView = function() {
		return document.getElementById("search-field").value.startsWith("#gallery:");
	};
	
	MyFlickr.toggleBigPicture = function(element, showBig) {
		if(showBig) {
			document.getElementById("imageviewer").style.display = "inline";
			document.getElementById("imageviewer").style.top = window.pageYOffset + "px";
			var picUrl;
			if(MyFlickr.isGalleryView()) {
				picUrl = MyFlickr.getFullSizePicture(MyFlickr.getPictureInCurrentGallery(element.id));
			} else {
				picUrl = MyFlickr.getFullSizePicture(MyFlickr.getPictureById(element.id));
			}
			document.getElementById("imageviewer-image").setAttribute("src", picUrl);
			document.body.style.overflow = "hidden";
		} else {
			document.getElementById("imageviewer").style.display = "none";
			document.getElementById("imageviewer-image").setAttribute("src", "");
			document.body.style.overflow = "auto";
		}
	};
	
	MyFlickr.getFullSizePicture = function(picture) {
		return MyFlickr.BIG_PICTURE_URL_TEMPLATE
		.replace("{server-id}", picture.server)
		.replace("{farm-id}", picture.farm)
		.replace("{id}", picture.id)
		.replace("{secret}", picture.secret);
	};
	
	MyFlickr.gallerySelected = function(element) {
		if(MyFlickr.renderAddToGallery()) {
			var selectedItems = document.getElementsByClassName("selected");
			var gallery = MyFlickr.getGalleryByName(element.innerHTML);
			for(var i=0; i < selectedItems.length; i++) {
				gallery.photos.push(MyFlickr.getPictureById(selectedItems[i].id));
			}
			MyFlickr.deselectAllPictures();
			MyFlickr.renderAddToGallery();
		} else {
			document.getElementById("search-field").value = "#gallery:" + element.innerHTML;
			MyFlickr.renderSearchResult(MyFlickr.getGalleryByName(element.innerHTML).photos, false);
		}
	};
	
	MyFlickr.renderAddToGallery = function() {
		var selectedItems = document.getElementsByClassName("selected");
		var buttonLabel = document.getElementById("gallerys-btn-label");
		if(selectedItems.length > 0) {
			buttonLabel.innerHTML = "Infoga " + selectedItems.length + " bilder i galleri";
			return true;
		} else {
			buttonLabel.innerHTML = MyFlickr.galleries.length + " galleri(er)";
			return false;
		}
	};
	
	MyFlickr.renderGalleries = function() {
		var container = document.getElementById("gallerys-dropbtn-items");
		container.innerHTML = "";
		var html = "";
		for(var i=0; i < MyFlickr.galleries.length; i++) {
			html += MyFlickr.GALLERY_ITEM_TEMPLATE.replace("{gallery-name}", MyFlickr.galleries[i].name);
		}
		container.innerHTML = html;
	};
	
	MyFlickr.renderSearchResult = function(photos, append) {
		var html = "";
		for(var i=0; i < photos.length; i++) {
			html += MyFlickr.PHOTO_TEMPLATE
					.replace("{image-url}", photos[i].url_t)
					.replace("{image-id}", photos[i].id);
		}
		var searchRes = document.getElementById("search-result");
		if(append) {
			searchRes.innerHTML = searchRes.innerHTML + html;
		} else {
			searchRes.innerHTML = html;
		}
	};
	
	MyFlickr.getJson = function(args) {
		var request = new XMLHttpRequest();
		request.open('GET', args.url, true);
		request.onload = function() {
			if (request.status >= 200 && request.status < 400) {
				var json = null;
				try {
					json = JSON.parse(request.responseText);
					args.success(json);
				} catch(e) {
					args.error(e);
				}
			} else {
				args.error(request);
			}
		};
		request.onerror = function() {
			args.error(request);
		};
		request.send();
	};

	MyFlickr.initialize();
};
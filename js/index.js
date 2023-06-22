import { getImages } from "./js/px-api.js";
import Notiflix from 'notiflix';
import "notiflix/src/notiflix.css";
import SimpleLightbox from "simplelightbox";
import "simplelightbox/dist/simple-lightbox.min.css";
import _ from 'lodash';
import $ from 'jquery';

let page = 1;
let querry = "";
let maxPage = 0;
const elemHeight = 560;
let moveScroll = 0;

const refs = {
    form: document.querySelector('#search-form'),
    gallery: document.querySelector('.gallery'),
  btnLoadMore: document.querySelector('.load-more'),
    body: document.body
}
const gallerySLb = new SimpleLightbox('.gallery a', { captionsData: "alt", captionDelay: "250" });

refs.body.style.overflow = 'hidden';

refs.form.addEventListener("submit", onSubmit);
refs.btnLoadMore.addEventListener("click", fetchImages);


if ('onwheel' in document) {
    // IE9+, FF17+, Ch31+
    window.addEventListener("wheel", _.debounce(onWheel, 300));
  } else if ('onmousewheel' in document) {
    // устаревший вариант события
    window.addEventListener("mousewheel", _.debounce(onWheel, 300));
  } else {
    // Firefox < 17
    window.addEventListener("MozMousePixelScroll", _.debounce(onWheel, 300));
  }

function onSubmit(event) {
    event.preventDefault();
    const inputValue = refs.form.elements.searchQuery.value.trim();
    if (inputValue === "") return Notiflix.Notify.failure("Empty query!");
    querry = inputValue;
    clearImgList();
    page = 1;
    fetchImages().then((hits) => {
      if (hits) {
        Notiflix.Notify.success(`Hooray! We found ${hits} images.`)
        maxPage = Math.ceil(hits / 40);
      }
    })
    .catch(onError)
      .finally(() => refs.form.reset());
}

async function fetchImages() {
  try {
      const data = await getImages(querry, page);
      if (!data.hits.length) throw new Error("Sorry, there are no images matching your search query. Please try again.");
      page += 1;
      const markup = await generateGalleryItems(data.hits)
      if (markup === undefined) throw new Error("No data!");
      await renderGallery(markup);
      return data.totalHits;
  } catch (err) {
    onError(err);
  }
}

function generateGalleryItems(data) {
  return data.reduce((markup, currentEl) => markup + createGalleryItem(currentEl), "");
}

function renderGallery(markup) {
  refs.gallery.insertAdjacentHTML("beforeend", markup);
  gallerySLb.refresh();
}

function createGalleryItem({ largeImageURL, webformatURL, tags, likes, views, comments, downloads }) {
    return `<div class="photo-card">
  <a class="gallery__link" href="${largeImageURL}">
    <img
      class="gallery__image"
      src="${webformatURL}"
      alt="${tags}"
    />
    <div class="info">
    <p class="info-item">
      <b>Likes</b> ${likes}
    </p>
    <p class="info-item">
      <b>Views</b> ${views}
    </p>
    <p class="info-item">
      <b>Comments</b> ${comments}
    </p>
    <p class="info-item">
      <b>Downloads</b> ${downloads}
    </p>
    </div>
  </a>
</div>`;
};

function clearImgList() {
  refs.gallery.innerHTML = "";
}

function onError(error) {
    Notiflix.Notify.failure(error.message);
}

function checkScrollPositionPage() {
   const scrollPosition = Math.ceil(window.scrollY);
  const bodyHeight = Math.ceil(document.body.getBoundingClientRect().height);
  const screenHeight = window.screen.height;
  return ((bodyHeight - scrollPosition) < screenHeight) ;
}

function checkScrollPositionElem() {
   const scrollPosition = Math.ceil(window.scrollY);
  const bodyHeight = Math.ceil(document.body.getBoundingClientRect().height);
  return (bodyHeight - scrollPosition) < elemHeight * 1.5;
}

function onWheel(e) {
  e.preventDefault ? e.preventDefault() : (e.returnValue = false);
  const delta = e.deltaY || e.detail || e.wheelDelta;
  if (delta > 0) {
    if (checkScrollPositionPage()) {
      if (page <= maxPage) {
        fetchImages()
      } else {
        Notiflix.Notify.failure("We're sorry, but you've reached the end of search results.");
      }
    };
    if (!checkScrollPositionElem()) {
      moveScroll += 1;
      scrollAnimate(elemHeight * moveScroll)
    }
  } else if (delta < 0) {
    if (moveScroll > 0) {
      moveScroll -= 1;
      scrollAnimate(elemHeight * moveScroll)
    }
  }
}

function scrollAnimate(position) {
  $('html, body').animate(
      {
        scrollTop: position,
      },
      //duration
      900,
    );
}
import Notiflix from 'notiflix';
import PixabayApi from './api.js';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import { createCardsList } from './markup.js';

const form = document.getElementById('search-form');
const pixabayApi = new PixabayApi();

let imagesData;
let totalImagesDisplayed = 0;
let isLoading = false;

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.querySelector('.search-form-input');
  searchInput.addEventListener('click', function () {
    if (this.value !== '') {
      this.value = '';
    }
  });
});

form.addEventListener('submit', onSubmit);

function onSubmit(event) {
  event.preventDefault();
  const searchTerm = form.elements.searchQuery.value.trim();
  if (!searchTerm) {
    Notiflix.Notify.warning('Please enter a search query.');
    return;
  }
  clearImagesList();
  pixabayApi.resetPage();
  totalImagesDisplayed = 0;
  loadMoreImages(searchTerm);
  window.addEventListener('scroll', handleInfiniteScroll);
}

async function loadMoreImages(query) {
  if (isLoading) return;
  isLoading = true;

  try {
    imagesData = await pixabayApi.getImages(query, pixabayApi.queryPage);

    if (!imagesData || imagesData.hits.length === 0) {
      Notiflix.Notify.failure(
        'Sorry, there are no images matching your search query. Please try again.'
      );
      return;
    }
    const markup = createCardsList(imagesData.hits);
    updateImagesList(markup);
    totalImagesDisplayed += imagesData.hits.length;
    pixabayApi.incrementPage();
    if (totalImagesDisplayed >= imagesData.totalHits) {
      Notiflix.Notify.info(
        "We're sorry, but you've reached the end of search results."
      );
      window.removeEventListener('scroll', handleInfiniteScroll);
    } else {
      showTotalHitsNotification(imagesData.totalHits);
    }
  } catch (error) {
    onError(error);
  } finally {
    isLoading = false;
  }
}

function showTotalHitsNotification(total) {
  Notiflix.Notify.success(`Hooray! We found ${total} images.`);
}

function clearImagesList() {
  const gallery = document.querySelector('.gallery');
  if (gallery) {
    gallery.innerHTML = '';
  }
}

function updateImagesList(markup) {
  const gallery = document.querySelector('.gallery');
  if (gallery) {
    gallery.insertAdjacentHTML('beforeend', markup);

    const newImages = gallery.querySelectorAll('.gallery a');

    newImages.forEach(image => {
      image.addEventListener('click', event => {
        event.preventDefault();
      });
    });

    if (window.simpleLightboxInstance) {
      window.simpleLightboxInstance.destroy();
    }

    window.simpleLightboxInstance = new SimpleLightbox(newImages, {
      sourceAttr: 'href',
      captionsData: 'alt',
      captionPosition: 'bottom',
      captionDelay: 250,
      animationSpeed: 250,
      fadeSpeed: 300,
      showCounter: true,
    });
  }
}

function onError(error) {
  console.error(error);
}

const handleInfiniteScroll = () => {
  const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

  if (scrollTop + clientHeight >= scrollHeight - 5 && !isLoading) {
    const searchTerm = form.elements.searchQuery.value.trim();
    loadMoreImages(searchTerm);
  }
};

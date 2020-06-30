import axios from 'axios';
import { $ } from './bling';

function ajaxHeart(e) {
  e.preventDefault();
  axios
    .post(this.action)
    .then((res) => {
      // this.heart comes from the form's button with a name attribute of "heart"
      const heartClassList = this.heart.classList;
      const isHearted = heartClassList.toggle('heart__button--hearted');

      $('.heart-count').textContent = res.data.hearts.length;
      if (isHearted) {
        heartClassList.add('heart__button--float');
        setTimeout(() => {
          heartClassList.remove('heart__button--float');
        }, 2500);
      }
    })
    .catch((err) => console.error(err));
}

export default ajaxHeart;

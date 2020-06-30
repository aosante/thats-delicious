import '../sass/style.scss';
// $ is a replacement for document.querySelector
// $$ is a replacement for document.querySelectorAll
import { $, $$ } from './modules/bling';
import autoComplete from './modules/autoComplete';
import typeAhead from './modules/typeAhead';
import makeMap from './modules/map';
import ajaxHeart from './modules/heart';

autoComplete($('#address'), $('#lat'), $('#lng'));

typeAhead($('.search'));

makeMap($('#map'));

const heartForms = $$('form.heart');
heartForms.on('submit', ajaxHeart);

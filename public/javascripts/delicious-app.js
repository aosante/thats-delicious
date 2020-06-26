import '../sass/style.scss';
// $ is a replacement for document.querySelector
// $$ is a replacement for document.querySelectorAll
import { $, $$ } from './modules/bling';
import autoComplete from './modules/autoComplete';
import typeAhead from './modules/typeAhead';

autoComplete($('#address'), $('#lat'), $('#lng'));

typeAhead($('.search'));

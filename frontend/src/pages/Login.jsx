import { useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';
import { usersAPI } from '../services/api';
import { useApp } from '../context/useApp';

const SECRET_KEY = 'MyRestaurant@SecretKey123';

// Brand text shown on the login page — change here only.
const BRAND_NAME = 'Vorpet';

// Modules listed under the form (display only — they cannot be opened before signing in).
const MODULES = [
  { icon:'table',    label:'POS & Tables' },
  { icon:'timer',    label:'Kitchen Display' },
  { icon:'receipt',  label:'Billing' },
  { icon:'staff',    label:'Staff & Roles' },
  { icon:'chart',    label:'Reports' },
  { icon:'building', label:'Multi-Company' },
  { icon:'box',      label:'Inventory Module' },
];

const ICONS = {
  table: <><path d="M12 16v14a9 9 0 0 0 18 0V16M21 39v46"/><ellipse cx="82" cy="27" rx="8" ry="12"/><path d="M82 39v46"/><ellipse cx="50" cy="52" rx="20" ry="7"/><path d="M50 59v24M38 87h24"/></>,
  timer: <><circle cx="50" cy="57" r="31"/><path d="M42 17h16M50 17v9M77 30l7-7M50 57V38M50 57l13 8"/></>,
  receipt: <><path d="M24 10H76V92L67.3 86L58.7 92L50 86L41.3 92L32.7 86L24 92Z"/><path d="M36 30H64M36 44H64M36 58H56"/></>,
  person: <><circle cx="50" cy="32" r="15"/><path d="M20 90C20 64 80 64 80 90"/></>,
  box: <><path d="M12 40L24 18H76L88 40"/><rect x="12" y="40" width="76" height="48"/><path d="M38 40v16h24V40"/></>,
  building: <><rect x="14" y="18" width="40" height="72"/><rect x="54" y="44" width="32" height="46"/><path d="M22 28h8v8h-8zM36 28h8v8h-8zM22 44h8v8h-8zM36 44h8v8h-8zM22 60h8v8h-8zM36 60h8v8h-8zM62 54h8v8h-8zM74 54h8v8h-8zM62 70h8v8h-8zM74 70h8v8h-8z"/></>,
  chart: <><rect x="14" y="56" width="17" height="34"/><rect x="41" y="38" width="17" height="52"/><rect x="68" y="18" width="17" height="72"/><path d="M8 90H92"/></>,
  staff: <><circle cx="38" cy="32" r="14"/><path d="M12 90C12 62 64 62 64 90"/><path d="M88.0 62.0 L92.8 64.4 L91.7 68.5 L86.3 68.1 L84.5 70.5 L86.2 75.6 L82.5 77.7 L79.0 73.6 L76.0 74.0 L73.6 78.8 L69.5 77.7 L69.9 72.3 L67.5 70.5 L62.4 72.2 L60.3 68.5 L64.4 65.0 L64.0 62.0 L59.2 59.6 L60.3 55.5 L65.7 55.9 L67.5 53.5 L65.8 48.4 L69.5 46.3 L73.0 50.4 L76.0 50.0 L78.4 45.2 L82.5 46.3 L82.1 51.7 L84.5 53.5 L89.6 51.8 L91.7 55.5 L87.6 59.0Z"/><circle cx="76" cy="62" r="5"/></>,
  desk: <><rect x="8" y="8" width="36" height="50"/><path d="M16 22h20M16 34h20M16 46h12"/><circle cx="70" cy="32" r="11"/><path d="M48 72C48 50 92 50 92 72"/><path d="M6 86H94"/></>,
  cashier: <><circle cx="34" cy="30" r="14"/><path d="M10 88C10 60 58 60 58 88"/><path d="M87.0 34.0 L91.8 36.3 L90.8 40.1 L85.5 39.6 L83.8 41.8 L85.6 46.8 L82.1 48.8 L78.7 44.7 L76.0 45.0 L73.7 49.8 L69.9 48.8 L70.4 43.5 L68.2 41.8 L63.2 43.6 L61.2 40.1 L65.3 36.7 L65.0 34.0 L60.2 31.7 L61.2 27.9 L66.5 28.4 L68.2 26.2 L66.4 21.2 L69.9 19.2 L73.3 23.3 L76.0 23.0 L78.3 18.2 L82.1 19.2 L81.6 24.5 L83.8 26.2 L88.8 24.4 L90.8 27.9 L86.7 31.3Z"/><circle cx="76" cy="34" r="5"/><path d="M62 88H92"/></>,
};

const LOOPS = [{"d": "M596.5 193.1 L598.8 203.2 L600.6 213.4 L601.8 223.6 L602.6 233.7 L602.9 243.7 L602.6 253.6 L601.9 263.2 L600.6 272.6 L598.9 281.7 L596.8 290.4 L594.3 298.7 L591.3 306.6 L588.0 314.1 L584.3 321.1 L580.3 327.6 L576.0 333.7 L571.5 339.2 L566.7 344.3 L561.7 348.9 L556.6 353.0 L551.2 356.6 L545.8 359.8 L540.2 362.5 L534.6 364.7 L528.8 366.6 L523.0 368.0 L517.2 369.0 L511.4 369.7 L505.5 370.0 L499.6 370.0 L493.8 369.7 L487.9 369.0 L482.1 368.1 L476.4 366.9 L470.6 365.4 L464.9 363.7 L459.3 361.8 L453.7 359.7 L448.1 357.4 L442.7 354.9 L437.2 352.3 L431.8 349.5 L426.5 346.5 L421.2 343.5 L416.0 340.3 L410.9 337.0 L405.8 333.5 L400.7 330.0 L395.7 326.4 L390.7 322.8 L385.8 319.0 L380.9 315.2 L376.1 311.3 L371.3 307.4 L366.5 303.4 L361.8 299.4 L357.1 295.3 L352.4 291.2 L347.7 287.1 L343.1 283.0 L338.4 278.8 L333.8 274.6 L329.2 270.4 L324.6 266.2 L320.0 262.0 L315.4 257.8 L310.8 253.6 L306.2 249.4 L301.6 245.2 L296.9 241.0 L292.3 236.9 L287.6 232.8 L282.9 228.7 L278.2 224.6 L273.5 220.6 L268.7 216.6 L263.9 212.7 L259.1 208.8 L254.2 205.0 L249.3 201.2 L244.3 197.6 L239.3 194.0 L234.2 190.5 L229.1 187.0 L224.0 183.7 L218.8 180.5 L213.5 177.5 L208.2 174.5 L202.8 171.7 L197.3 169.1 L191.9 166.6 L186.3 164.3 L180.7 162.2 L175.1 160.3 L169.4 158.6 L163.6 157.1 L157.9 155.9 L152.1 155.0 L146.2 154.3 L140.4 154.0 L134.5 154.0 L128.6 154.3 L122.8 155.0 L117.0 156.0 L111.2 157.4 L105.4 159.3 L99.8 161.5 L94.2 164.2 L88.8 167.4 L83.4 171.0 L78.3 175.1 L73.3 179.7 L68.5 184.8 L64.0 190.3 L59.7 196.4 L55.7 202.9 L52.0 209.9 L48.7 217.4 L45.7 225.3 L43.2 233.6 L41.1 242.3 L39.4 251.4 L38.1 260.8 L37.4 270.4 L37.1 280.3 L37.4 290.3 L38.2 300.4 L39.4 310.6 L41.2 320.8 L43.5 330.9 L46.2 341.0 L49.4 350.8 L53.1 360.4 L57.2 369.7 L61.7 378.7 L66.5 387.3 L71.7 395.4 L77.2 403.1 L82.9 410.3 L88.9 417.0 L95.1 423.2 L101.4 428.8 L107.8 433.8 L114.4 438.3 L121.0 442.2 L127.6 445.5 L134.2 448.3 L140.8 450.5 L147.3 452.2 L153.8 453.4 L160.2 454.1 L166.5 454.3 L172.7 454.1 L178.8 453.4 L184.7 452.4 L190.5 450.9 L196.1 449.1 L201.6 446.9 L206.9 444.5 L212.1 441.7 L217.1 438.6 L222.0 435.3 L226.6 431.8 L231.2 428.0 L235.6 424.0 L239.8 419.9 L243.9 415.5 L247.8 411.0 L251.7 406.4 L255.3 401.6 L258.9 396.8 L262.3 391.8 L265.6 386.7 L268.9 381.5 L272.0 376.2 L275.0 370.8 L277.9 365.4 L280.7 360.0 L283.4 354.4 L286.1 348.9 L288.7 343.2 L291.2 337.6 L293.6 331.9 L296.0 326.1 L298.4 320.4 L300.7 314.6 L302.9 308.8 L305.1 303.0 L307.3 297.2 L309.5 291.3 L311.6 285.5 L313.7 279.6 L315.8 273.7 L317.9 267.9 L320.0 262.0 L322.1 256.1 L324.2 250.3 L326.3 244.4 L328.4 238.5 L330.5 232.7 L332.7 226.8 L334.9 221.0 L337.1 215.2 L339.3 209.4 L341.6 203.6 L344.0 197.9 L346.4 192.1 L348.8 186.4 L351.3 180.8 L353.9 175.1 L356.6 169.6 L359.3 164.0 L362.1 158.6 L365.0 153.2 L368.0 147.8 L371.1 142.5 L374.4 137.3 L377.7 132.2 L381.1 127.2 L384.7 122.4 L388.3 117.6 L392.2 113.0 L396.1 108.5 L400.2 104.1 L404.4 100.0 L408.8 96.0 L413.4 92.2 L418.0 88.7 L422.9 85.4 L427.9 82.3 L433.1 79.5 L438.4 77.1 L443.9 74.9 L449.5 73.1 L455.3 71.6 L461.2 70.6 L467.3 69.9 L473.5 69.7 L479.8 69.9 L486.2 70.6 L492.7 71.8 L499.2 73.5 L505.8 75.7 L512.4 78.5 L519.0 81.8 L525.6 85.7 L532.2 90.2 L538.6 95.2 L544.9 100.8 L551.1 107.0 L557.1 113.7 L562.8 120.9 L568.3 128.6 L573.5 136.7 L578.3 145.3 L582.8 154.3 L586.9 163.6 L590.6 173.2 L593.8 183.0 L596.5 193.1", "dash": null}, {"d": "M585.5 195.8 L587.4 204.6 L588.9 213.5 L589.9 222.4 L590.4 231.3 L590.4 240.0 L590.0 248.7 L589.1 257.1 L587.7 265.4 L585.9 273.3 L583.7 281.0 L581.1 288.3 L578.1 295.3 L574.8 301.9 L571.1 308.1 L567.2 313.9 L562.9 319.3 L558.5 324.3 L553.8 328.8 L549.0 332.9 L543.9 336.6 L538.8 339.9 L533.5 342.8 L528.1 345.3 L522.7 347.4 L517.2 349.1 L511.6 350.5 L506.0 351.5 L500.4 352.2 L494.8 352.6 L489.2 352.7 L483.6 352.6 L478.1 352.1 L472.6 351.4 L467.1 350.5 L461.6 349.3 L456.2 348.0 L450.9 346.4 L445.6 344.7 L440.3 342.8 L435.1 340.8 L430.0 338.6 L424.9 336.2 L419.9 333.8 L414.9 331.2 L410.0 328.5 L405.2 325.7 L400.4 322.8 L395.6 319.8 L390.9 316.8 L386.2 313.7 L381.6 310.5 L377.0 307.3 L372.5 304.0 L368.0 300.6 L363.5 297.3 L359.1 293.8 L354.7 290.4 L350.3 286.9 L345.9 283.4 L341.6 279.9 L337.2 276.3 L332.9 272.7 L328.6 269.2 L324.3 265.6 L320.0 262.0 L315.7 258.4 L311.4 254.8 L307.1 251.3 L302.8 247.7 L298.4 244.1 L294.1 240.6 L289.7 237.1 L285.3 233.6 L280.9 230.2 L276.5 226.7 L272.0 223.4 L267.5 220.0 L263.0 216.7 L258.4 213.5 L253.8 210.3 L249.1 207.2 L244.4 204.2 L239.6 201.2 L234.8 198.3 L230.0 195.5 L225.1 192.8 L220.1 190.2 L215.1 187.8 L210.0 185.4 L204.9 183.2 L199.7 181.2 L194.4 179.3 L189.1 177.6 L183.8 176.0 L178.4 174.7 L172.9 173.5 L167.4 172.6 L161.9 171.9 L156.4 171.4 L150.8 171.3 L145.2 171.4 L139.6 171.8 L134.0 172.5 L128.4 173.5 L122.8 174.9 L117.3 176.6 L111.9 178.7 L106.5 181.2 L101.2 184.1 L96.1 187.4 L91.0 191.1 L86.2 195.2 L81.5 199.7 L77.1 204.7 L72.8 210.1 L68.9 215.9 L65.2 222.1 L61.9 228.7 L58.9 235.7 L56.3 243.0 L54.1 250.7 L52.3 258.6 L50.9 266.9 L50.0 275.3 L49.6 284.0 L49.6 292.7 L50.1 301.6 L51.1 310.5 L52.6 319.4 L54.5 328.2 L56.9 336.9 L59.8 345.4 L63.1 353.8 L66.8 361.8 L70.9 369.6 L75.4 377.0 L80.1 384.0 L85.2 390.6 L90.5 396.8 L96.1 402.6 L101.8 407.8 L107.8 412.6 L113.8 416.8 L120.0 420.6 L126.2 423.9 L132.4 426.7 L138.7 429.0 L144.9 430.8 L151.1 432.1 L157.3 433.0 L163.4 433.5 L169.4 433.6 L175.3 433.2 L181.1 432.5 L186.8 431.5 L192.4 430.1 L197.8 428.4 L203.1 426.4 L208.2 424.1 L213.2 421.6 L218.0 418.8 L222.7 415.8 L227.3 412.6 L231.7 409.2 L236.0 405.6 L240.1 401.9 L244.1 398.0 L248.0 394.0 L251.7 389.8 L255.3 385.6 L258.8 381.2 L262.2 376.8 L265.5 372.3 L268.6 367.6 L271.7 363.0 L274.7 358.2 L277.6 353.4 L280.4 348.6 L283.1 343.7 L285.8 338.7 L288.4 333.8 L290.9 328.8 L293.4 323.7 L295.8 318.7 L298.1 313.6 L300.4 308.5 L302.7 303.3 L304.9 298.2 L307.2 293.1 L309.3 287.9 L311.5 282.7 L313.6 277.5 L315.8 272.4 L317.9 267.2 L320.0 262.0 L322.1 256.8 L324.2 251.6 L326.4 246.5 L328.5 241.3 L330.7 236.1 L332.8 230.9 L335.1 225.8 L337.3 220.7 L339.6 215.5 L341.9 210.4 L344.2 205.3 L346.6 200.3 L349.1 195.2 L351.6 190.2 L354.2 185.3 L356.9 180.3 L359.6 175.4 L362.4 170.6 L365.3 165.8 L368.3 161.0 L371.4 156.4 L374.5 151.7 L377.8 147.2 L381.2 142.8 L384.7 138.4 L388.3 134.2 L392.0 130.0 L395.9 126.0 L399.9 122.1 L404.0 118.4 L408.3 114.8 L412.7 111.4 L417.3 108.2 L422.0 105.2 L426.8 102.4 L431.8 99.9 L436.9 97.6 L442.2 95.6 L447.6 93.9 L453.2 92.5 L458.9 91.5 L464.7 90.8 L470.6 90.4 L476.6 90.5 L482.7 91.0 L488.9 91.9 L495.1 93.2 L501.3 95.0 L507.6 97.3 L513.8 100.1 L520.0 103.4 L526.2 107.2 L532.2 111.4 L538.2 116.2 L543.9 121.4 L549.5 127.2 L554.8 133.4 L559.9 140.0 L564.6 147.0 L569.1 154.4 L573.2 162.2 L576.9 170.2 L580.2 178.6 L583.1 187.1 L585.5 195.8", "dash": "640 24 240 30"}, {"d": "M574.4 198.6 L576.0 206.1 L577.2 213.7 L578.0 221.3 L578.2 228.8 L578.0 236.3 L577.4 243.8 L576.3 251.0 L574.8 258.1 L572.9 265.0 L570.6 271.6 L567.9 278.0 L564.9 284.0 L561.5 289.8 L557.9 295.2 L554.0 300.2 L549.8 305.0 L545.5 309.3 L540.9 313.3 L536.2 317.0 L531.3 320.3 L526.3 323.2 L521.2 325.8 L516.0 328.1 L510.8 330.0 L505.5 331.7 L500.2 333.0 L494.8 334.0 L489.5 334.8 L484.1 335.2 L478.8 335.5 L473.5 335.5 L468.2 335.2 L463.0 334.8 L457.8 334.1 L452.6 333.3 L447.5 332.2 L442.5 331.0 L437.5 329.7 L432.5 328.2 L427.6 326.6 L422.8 324.8 L418.0 322.9 L413.3 321.0 L408.6 318.9 L404.0 316.7 L399.5 314.4 L395.0 312.1 L390.5 309.7 L386.1 307.2 L381.8 304.6 L377.4 302.0 L373.2 299.4 L368.9 296.6 L364.7 293.9 L360.5 291.1 L356.4 288.3 L352.3 285.4 L348.2 282.6 L344.1 279.7 L340.1 276.8 L336.0 273.8 L332.0 270.9 L328.0 267.9 L324.0 265.0 L320.0 262.0 L316.0 259.0 L312.0 256.1 L308.0 253.1 L304.0 250.2 L299.9 247.2 L295.9 244.3 L291.8 241.4 L287.7 238.6 L283.6 235.7 L279.5 232.9 L275.3 230.1 L271.1 227.4 L266.8 224.6 L262.6 222.0 L258.2 219.4 L253.9 216.8 L249.5 214.3 L245.0 211.9 L240.5 209.6 L236.0 207.3 L231.4 205.1 L226.7 203.0 L222.0 201.1 L217.2 199.2 L212.4 197.4 L207.5 195.8 L202.5 194.3 L197.5 193.0 L192.5 191.8 L187.4 190.7 L182.2 189.9 L177.0 189.2 L171.8 188.8 L166.5 188.5 L161.2 188.5 L155.9 188.8 L150.5 189.2 L145.2 190.0 L139.8 191.0 L134.5 192.3 L129.2 194.0 L124.0 195.9 L118.8 198.2 L113.7 200.8 L108.7 203.7 L103.8 207.0 L99.1 210.7 L94.5 214.7 L90.2 219.0 L86.0 223.8 L82.1 228.8 L78.5 234.2 L75.1 240.0 L72.1 246.0 L69.4 252.4 L67.1 259.0 L65.2 265.9 L63.7 273.0 L62.6 280.2 L62.0 287.7 L61.8 295.2 L62.0 302.7 L62.8 310.3 L64.0 317.9 L65.6 325.4 L67.7 332.8 L70.2 340.1 L73.1 347.1 L76.4 353.9 L80.1 360.5 L84.2 366.7 L88.6 372.6 L93.2 378.2 L98.1 383.3 L103.3 388.1 L108.6 392.5 L114.1 396.4 L119.8 399.9 L125.5 403.0 L131.4 405.6 L137.2 407.8 L143.1 409.6 L149.1 411.0 L154.9 412.1 L160.8 412.7 L166.6 412.9 L172.3 412.8 L177.9 412.4 L183.5 411.6 L188.9 410.6 L194.2 409.3 L199.4 407.7 L204.5 405.8 L209.5 403.7 L214.3 401.4 L219.0 398.9 L223.5 396.2 L227.9 393.4 L232.2 390.3 L236.4 387.2 L240.4 383.9 L244.3 380.5 L248.1 376.9 L251.7 373.3 L255.3 369.5 L258.7 365.7 L262.1 361.8 L265.3 357.9 L268.4 353.8 L271.5 349.7 L274.4 345.6 L277.3 341.4 L280.1 337.2 L282.8 332.9 L285.5 328.6 L288.1 324.3 L290.6 319.9 L293.1 315.6 L295.5 311.2 L297.9 306.7 L300.2 302.3 L302.5 297.9 L304.8 293.4 L307.0 288.9 L309.2 284.5 L311.4 280.0 L313.5 275.5 L315.7 271.0 L317.9 266.5 L320.0 262.0 L322.1 257.5 L324.3 253.0 L326.5 248.5 L328.6 244.0 L330.8 239.5 L333.0 235.1 L335.2 230.6 L337.5 226.1 L339.8 221.7 L342.1 217.3 L344.5 212.8 L346.9 208.4 L349.4 204.1 L351.9 199.7 L354.5 195.4 L357.2 191.1 L359.9 186.8 L362.7 182.6 L365.6 178.4 L368.5 174.3 L371.6 170.2 L374.7 166.1 L377.9 162.2 L381.3 158.3 L384.7 154.5 L388.3 150.7 L391.9 147.1 L395.7 143.5 L399.6 140.1 L403.6 136.8 L407.8 133.7 L412.1 130.6 L416.5 127.8 L421.0 125.1 L425.7 122.6 L430.5 120.3 L435.5 118.2 L440.6 116.3 L445.8 114.7 L451.1 113.4 L456.5 112.4 L462.1 111.6 L467.7 111.2 L473.4 111.1 L479.2 111.3 L485.1 111.9 L490.9 113.0 L496.9 114.4 L502.8 116.2 L508.6 118.4 L514.5 121.0 L520.2 124.1 L525.9 127.6 L531.4 131.5 L536.7 135.9 L541.9 140.7 L546.8 145.8 L551.4 151.4 L555.8 157.3 L559.9 163.5 L563.6 170.1 L566.9 176.9 L569.8 183.9 L572.3 191.2 L574.4 198.6", "dash": "420 40 180 26"}, {"d": "M563.4 201.3 L564.7 207.5 L565.6 213.8 L566.0 220.1 L566.0 226.4 L565.6 232.6 L564.8 238.8 L563.5 244.9 L561.9 250.9 L559.8 256.6 L557.4 262.2 L554.7 267.6 L551.6 272.7 L548.3 277.6 L544.7 282.2 L540.8 286.6 L536.7 290.6 L532.5 294.4 L528.0 297.9 L523.4 301.1 L518.7 303.9 L513.8 306.5 L508.9 308.9 L503.9 310.9 L498.9 312.7 L493.8 314.2 L488.7 315.5 L483.6 316.5 L478.5 317.3 L473.5 317.8 L468.4 318.2 L463.4 318.4 L458.4 318.3 L453.4 318.1 L448.5 317.7 L443.6 317.2 L438.8 316.5 L434.0 315.6 L429.3 314.7 L424.7 313.6 L420.1 312.4 L415.6 311.1 L411.1 309.7 L406.7 308.2 L402.3 306.6 L398.0 304.9 L393.8 303.2 L389.6 301.3 L385.4 299.5 L381.3 297.5 L377.3 295.5 L373.3 293.5 L369.3 291.4 L365.3 289.3 L361.4 287.2 L357.6 285.0 L353.7 282.7 L349.9 280.5 L346.1 278.2 L342.4 276.0 L338.6 273.7 L334.9 271.3 L331.1 269.0 L327.4 266.7 L323.7 264.3 L320.0 262.0 L316.3 259.7 L312.6 257.3 L308.9 255.0 L305.1 252.7 L301.4 250.3 L297.6 248.0 L293.9 245.8 L290.1 243.5 L286.3 241.3 L282.4 239.0 L278.6 236.8 L274.7 234.7 L270.7 232.6 L266.7 230.5 L262.7 228.5 L258.7 226.5 L254.6 224.5 L250.4 222.7 L246.2 220.8 L242.0 219.1 L237.7 217.4 L233.3 215.8 L228.9 214.3 L224.4 212.9 L219.9 211.6 L215.3 210.4 L210.7 209.3 L206.0 208.4 L201.2 207.5 L196.4 206.8 L191.5 206.3 L186.6 205.9 L181.6 205.7 L176.6 205.6 L171.6 205.8 L166.5 206.2 L161.5 206.7 L156.4 207.5 L151.3 208.5 L146.2 209.8 L141.1 211.3 L136.1 213.1 L131.1 215.1 L126.2 217.5 L121.3 220.1 L116.6 222.9 L112.0 226.1 L107.5 229.6 L103.3 233.4 L99.2 237.4 L95.3 241.8 L91.7 246.4 L88.4 251.3 L85.3 256.4 L82.6 261.8 L80.2 267.4 L78.1 273.1 L76.5 279.1 L75.2 285.2 L74.4 291.4 L74.0 297.6 L74.0 303.9 L74.4 310.2 L75.3 316.5 L76.6 322.7 L78.4 328.8 L80.6 334.7 L83.1 340.5 L86.1 346.1 L89.4 351.4 L93.0 356.5 L97.0 361.2 L101.2 365.7 L105.7 369.8 L110.5 373.7 L115.4 377.1 L120.5 380.2 L125.8 383.0 L131.1 385.3 L136.6 387.4 L142.1 389.0 L147.6 390.3 L153.2 391.3 L158.7 392.0 L164.3 392.3 L169.8 392.3 L175.2 392.1 L180.5 391.5 L185.8 390.8 L191.0 389.7 L196.1 388.4 L201.1 386.9 L206.0 385.2 L210.7 383.4 L215.4 381.3 L219.9 379.1 L224.3 376.7 L228.6 374.2 L232.7 371.5 L236.8 368.8 L240.7 365.9 L244.5 362.9 L248.2 359.8 L251.8 356.7 L255.3 353.5 L258.7 350.2 L261.9 346.9 L265.1 343.5 L268.2 340.0 L271.2 336.5 L274.2 333.0 L277.0 329.4 L279.8 325.8 L282.5 322.2 L285.2 318.5 L287.8 314.8 L290.3 311.1 L292.8 307.4 L295.2 303.7 L297.6 299.9 L300.0 296.2 L302.3 292.4 L304.6 288.6 L306.8 284.8 L309.1 281.0 L311.3 277.2 L313.5 273.4 L315.6 269.6 L317.8 265.8 L320.0 262.0 L322.2 258.2 L324.4 254.4 L326.5 250.6 L328.7 246.8 L330.9 243.0 L333.2 239.2 L335.4 235.4 L337.7 231.6 L340.0 227.8 L342.4 224.1 L344.8 220.3 L347.2 216.6 L349.7 212.9 L352.2 209.2 L354.8 205.5 L357.5 201.8 L360.2 198.2 L363.0 194.6 L365.8 191.0 L368.8 187.5 L371.8 184.0 L374.9 180.5 L378.1 177.1 L381.3 173.8 L384.7 170.5 L388.2 167.3 L391.8 164.2 L395.5 161.1 L399.3 158.1 L403.2 155.2 L407.3 152.5 L411.4 149.8 L415.7 147.3 L420.1 144.9 L424.6 142.7 L429.3 140.6 L434.0 138.8 L438.9 137.1 L443.9 135.6 L449.0 134.3 L454.2 133.2 L459.5 132.5 L464.8 131.9 L470.2 131.7 L475.7 131.7 L481.3 132.0 L486.8 132.7 L492.4 133.7 L497.9 135.0 L503.4 136.6 L508.9 138.7 L514.2 141.0 L519.5 143.8 L524.6 146.9 L529.5 150.3 L534.3 154.2 L538.8 158.3 L543.0 162.8 L547.0 167.5 L550.6 172.6 L553.9 177.9 L556.9 183.5 L559.4 189.3 L561.6 195.2 L563.4 201.3", "dash": "260 50 120 36"}];
const PLACE = [["table", 104, 86, 100], ["timer", 300, 36, 80], ["receipt", 350, 158, 84], ["desk", 64, 236, 94], ["staff", 190, 296, 90], ["cashier", 384, 262, 94], ["building", 496, 232, 112], ["chart", 316, 396, 86]];

/* One outlined icon on a 100 x 100 grid. */
function Icon({ name, size = 24, sw = 6, color = 'currentColor', x, y }) {
  return (
    <svg x={x} y={y} width={size} height={size} viewBox="0 0 100 100" overflow="visible" aria-hidden="true"
         fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {ICONS[name]}
    </svg>
  );
}

/* Small bowl mark next to the wordmark */
function BowlMark({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path d="M15 17c-3-3 3-5 0-9M24 17c-3-3 3-5 0-9M33 17c-3-3 3-5 0-9"
            stroke="#FCD34D" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M6 24h36c0 10-8 18-18 18S6 34 6 24z" fill="#F59E0B"/>
      <rect x="4" y="21" width="40" height="4.5" rx="2.25" fill="#FBBF24"/>
    </svg>
  );
}

/* Line-art illustration: a looping ribbon with the parts of running a restaurant */
function Art() {
  const tan = '#D8B48A';
  return (
    <svg viewBox="0 0 640 520" className="vl-art-svg" role="img"
         aria-label="Illustration of tables, kitchen timer, receipts, staff, reports and multiple branches joined by a looping ribbon">
      <defs>
        <mask id="vl-cut" maskUnits="userSpaceOnUse" x="0" y="0" width="640" height="520">
          <rect width="640" height="520" fill="#fff"/>
          {PLACE.map(([n, x, y, s]) => (
            <rect key={n} x={x + s * 0.04} y={y + s * 0.04} width={s * 0.92} height={s * 0.92} rx="12" fill="#000"/>
          ))}
        </mask>
      </defs>
      <g mask="url(#vl-cut)" fill="none" stroke={tan} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        {LOOPS.map((l, i) => (
          <path key={i} d={l.d} strokeDasharray={l.dash || undefined} opacity={i === 0 ? 1 : 0.85}/>
        ))}
      </g>
      {PLACE.map(([n, x, y, s]) => (
        <Icon key={n} name={n} x={x} y={y} size={s} sw={3.4} color={tan}/>
      ))}
    </svg>
  );
}

export default function Login() {
  const { login, showToast } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState('');
  const [warming,  setWarming]  = useState(false);

  // Check if backend is awake when login page loads
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        await fetch('/health', { signal: controller.signal });
        clearTimeout(timeout);
      } catch {
        // Backend sleeping — show warming message and wake it up
        setWarming(true);
        try {
          await fetch('/company/');
        } catch {}
        setWarming(false);
      }
    };
    checkBackend();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) { setError('Enter your username and password.'); return; }
    setError(''); setLoading(true);
    try {
      const enc = CryptoJS.AES.encrypt(password, SECRET_KEY).toString();
      const res = await usersAPI.login({ username: username.trim(), password: enc });
      login(res);
      showToast(`Welcome, ${res.user_details.first_name}!`);
    } catch (err) { setError(err.message || 'Invalid username or password.'); }
    setLoading(false);
  };

  return (
    <div className="vl-root">
      <style>{CSS}</style>

      {/* ── Brand panel ── */}
      <section className="vl-brand" aria-label={BRAND_NAME}>
        <div className="vl-top">
          <BowlMark />
          <div className="vl-word">{BRAND_NAME}</div>
        </div>
        <div className="vl-art"><Art /></div>
        <h2 className="vl-headline">Comprehensive Restaurant Suite: From Orders to Insights.</h2>
      </section>

      {/* ── Sign-in ── */}
      <main className="vl-side">
        <div className="vl-wrap">
          <h1 className="vl-h1">Sign in</h1>
          <p className="vl-sub">Use the username and password for your account.</p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="vl-field">
              <label htmlFor="vl-user" className="vl-label">Username</label>
              <input id="vl-user" className="vl-input" type="text" placeholder="Enter your username"
                autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false}
                value={username} onChange={e => setUsername(e.target.value)} autoFocus />
            </div>

            <div className="vl-field">
              <label htmlFor="vl-pass" className="vl-label">Password</label>
              <div className="vl-passwrap">
                <input id="vl-pass" className="vl-input vl-input-pass" type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password" autoComplete="current-password"
                  value={password} onChange={e => setPassword(e.target.value)} />
                <button type="button" className="vl-toggle" aria-pressed={showPass}
                  onClick={() => setShowPass(v => !v)}>
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div role="alert" aria-live="polite">
              {error && <div className="vl-error">{error}</div>}
            </div>

            <button type="submit" className="vl-submit" disabled={loading}>
              {loading
                ? <><span className="vl-spin" aria-hidden="true"/>Signing in…</>
                : <><span>Sign in</span>
                    <svg className="vl-go" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor"
                         strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M6 14L14 6M7 6h7v7"/>
                    </svg></>}
            </button>

            {warming && <p className="vl-warm">Waking up the server. This can take a few seconds.</p>}
          </form>

          <h3 className="vl-mod-h">Quick Access Modules</h3>
          <ul className="vl-mods">
            {MODULES.map(m => (
              <li key={m.label} className="vl-mod">
                <Icon name={m.icon} size={24} sw={7}/>
                <span>{m.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="vl-foot">v2.0 - Secure Platform</div>
      </main>
    </div>
  );
}

const CSS = `
.vl-root{
  --vl-cream:  #F1DFC4;
  --vl-paper:  #EFEDE9;
  --vl-lift:   8px 8px 18px rgba(154,146,135,.42), -8px -8px 18px rgba(255,255,255,.95);
  --vl-lift-s: 5px 5px 12px rgba(154,146,135,.40), -5px -5px 12px rgba(255,255,255,.95);
  --vl-sink:   inset 4px 4px 9px rgba(154,146,135,.42), inset -4px -4px 9px rgba(255,255,255,.9);
  --vl-green:  linear-gradient(135deg, var(--green-800, #166534), var(--green-700, #15803d));
  --vl-ink:    #2A2622;
  --vl-muted:  #6E675F;
  --vl-title:  var(--green-800, #166534);
  min-height:100vh; display:grid; grid-template-columns:minmax(0,1.15fr) minmax(400px,1fr);
  font-family:'DM Sans',system-ui,sans-serif; color:var(--vl-ink); background:var(--vl-paper);
}
.vl-root *{ box-sizing:border-box; }

/* brand panel */
.vl-brand{
  position:relative; color:var(--vl-cream); overflow:hidden;
  background:radial-gradient(ellipse 72% 62% at 50% 46%, #5F3189 0%, #43206E 52%, #27113F 100%);
  padding:40px 56px 48px; display:flex; flex-direction:column; justify-content:space-between; gap:20px;
}
.vl-top{ display:flex; align-items:center; gap:12px; }
.vl-word{ font-family:'DM Serif Display',Georgia,serif; font-size:26px; line-height:1; color:var(--vl-cream); }
.vl-art{ flex:1; display:flex; align-items:center; justify-content:center; min-height:0; }
.vl-art-svg{ width:min(600px,100%); height:auto; display:block; }
.vl-headline{
  font-family:'DM Serif Display',Georgia,serif; font-weight:400; margin:0; max-width:15em;
  font-size:clamp(28px,2.9vw,42px); line-height:1.14; color:var(--vl-cream);
}

/* sign-in side */
.vl-side{
  display:flex; flex-direction:column; align-items:center; justify-content:space-between;
  padding:48px 32px 24px; background:linear-gradient(160deg,#F5F3F0 0%,#E9E6E1 100%);
}
.vl-wrap{ width:100%; max-width:420px; margin:auto 0; padding:8px 0 24px; }
.vl-h1{ font-family:'DM Serif Display',Georgia,serif; font-weight:400; font-size:42px; line-height:1.08; margin:0 0 8px; color:var(--vl-title); }
.vl-sub{ margin:0 0 28px; font-size:15px; line-height:1.5; color:var(--vl-muted); }

.vl-field{ margin-bottom:20px; }
.vl-label{ display:block; margin-bottom:9px; font-size:14px; font-weight:600; color:#3A342E; }
.vl-input{
  width:100%; height:54px; padding:0 18px; font:inherit; font-size:16px; color:var(--vl-ink);
  background:var(--vl-paper); border:none; border-radius:16px; outline:none;
  box-shadow:var(--vl-lift-s); transition:box-shadow .18s;
}
.vl-input::placeholder{ color:#7A736A; }
.vl-input:focus{ box-shadow:var(--vl-sink), 0 0 0 3px rgba(22,101,52,.45); }
.vl-passwrap{ position:relative; }
.vl-input-pass{ padding-right:76px; }
.vl-toggle{
  position:absolute; top:7px; right:8px; height:40px; padding:0 12px; border:none; border-radius:10px;
  background:transparent; font:inherit; font-size:14px; font-weight:600; color:var(--vl-ink); cursor:pointer;
}
.vl-toggle:hover{ color:var(--green-800, #166534); }
.vl-toggle:focus-visible{ outline:3px solid rgb(124,58,237); outline-offset:1px; }

.vl-error{
  margin:0 0 16px; padding:11px 14px; font-size:14px; line-height:1.4;
  color:#991b1b; background:var(--error-bg, #fef2f2); border-left:3px solid var(--error, #dc2626); border-radius:10px;
}

.vl-submit{
  position:relative; width:100%; height:56px; display:flex; align-items:center; justify-content:center; gap:10px;
  font:inherit; font-size:16px; font-weight:600; color:#fff; letter-spacing:.01em;
  background:var(--vl-green); border:none; border-radius:14px; cursor:pointer; margin-top:4px;
  box-shadow:0 10px 22px rgba(22,101,52,.32), inset 0 1px 0 rgba(255,255,255,.18);
  transition:filter .15s, transform .05s;
}
.vl-go{ position:absolute; right:20px; }
.vl-submit:hover:not(:disabled){ filter:brightness(1.08); }
.vl-submit:active:not(:disabled){ transform:translateY(1px); }
.vl-submit:focus-visible{ outline:3px solid rgb(124,58,237); outline-offset:3px; }
.vl-submit:disabled{ opacity:.85; cursor:progress; }
.vl-spin{ width:18px; height:18px; border:2.5px solid rgba(255,255,255,.4); border-top-color:#fff; border-radius:50%; animation:vl-spin .7s linear infinite; }
@keyframes vl-spin{ to{ transform:rotate(360deg); } }
.vl-warm{ margin:16px 0 0; font-size:13.5px; color:var(--vl-muted); }

.vl-mod-h{ font-family:'DM Serif Display',Georgia,serif; font-weight:400; font-size:21px; margin:34px 0 16px; color:var(--vl-ink); }
.vl-mods{ list-style:none; margin:0; padding:0; display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
.vl-mod{
  display:flex; align-items:center; gap:10px; min-height:66px; padding:12px 12px;
  background:var(--vl-paper); border-radius:16px; box-shadow:var(--vl-lift-s);
  font-size:13.5px; font-weight:500; line-height:1.25; color:var(--vl-ink);
}
.vl-mod svg{ flex:0 0 auto; }

.vl-foot{ padding-top:16px; font-size:12.5px; color:var(--vl-muted); }

/* tablets and phones: brand panel becomes a slim header */
@media (max-width:860px){
  .vl-root{ grid-template-columns:1fr; grid-template-rows:auto 1fr; }
  .vl-brand{ flex-direction:row; align-items:center; padding:16px 22px; }
  .vl-art, .vl-headline{ display:none; }
  .vl-side{ padding:32px 22px 20px; }
  .vl-h1{ font-size:36px; }
}
@media (max-width:520px){
  .vl-mods{ grid-template-columns:repeat(2,1fr); gap:14px; }
}
@media (prefers-reduced-motion:reduce){
  .vl-spin{ animation-duration:1.6s; }
}
`;

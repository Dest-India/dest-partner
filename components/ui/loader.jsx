function Loader({ className }) {
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" viewBox="0 0 24 24">
    <g>
      <rect width="2" height="5" rx="1" ry="1" x="11" y="1" fill="currentColor" opacity=".14" />
      <rect width="2" height="5" rx="1" ry="1" x="11" y="1" fill="currentColor" opacity=".29" transform="rotate(30 12 12)" />
      <rect width="2" height="5" rx="1" ry="1" x="11" y="1" fill="currentColor" opacity=".43" transform="rotate(60 12 12)" />
      <rect width="2" height="5" rx="1" ry="1" x="11" y="1" fill="currentColor" opacity=".57" transform="rotate(90 12 12)" />
      <rect width="2" height="5" rx="1" ry="1" x="11" y="1" fill="currentColor" opacity=".71" transform="rotate(120 12 12)" />
      <rect width="2" height="5" rx="1" ry="1" x="11" y="1" fill="currentColor" opacity=".86" transform="rotate(150 12 12)" />
      <rect width="2" height="5" rx="1" ry="1" x="11" y="1" fill="currentColor" transform="rotate(180 12 12)" />
      <animateTransform attributeName="transform" calcMode="discrete" dur="0.75s" repeatCount="indefinite" type="rotate" values="0 12 12;30 12 12;60 12 12;90 12 12;120 12 12;150 12 12;180 12 12;210 12 12;240 12 12;270 12 12;300 12 12;330 12 12;360 12 12" />
    </g>
  </svg>
}

function Loader2({ className }) {
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
    <circle cx="4" cy="12" r="2.5" fill="currentColor">
      <animate id="SVGKiXXedfO" attributeName="cy" begin="0;SVGgLulOGrw.end+0.25s" calcMode="spline" dur="0.6s" keySplines=".33,.66,.66,1;.33,0,.66,.33" values="12;6;12" />
    </circle>
    <circle cx="12" cy="12" r="2.5" fill="currentColor">
      <animate attributeName="cy" begin="SVGKiXXedfO.begin+0.1s" calcMode="spline" dur="0.6s" keySplines=".33,.66,.66,1;.33,0,.66,.33" values="12;6;12" />
    </circle>
    <circle cx="20" cy="12" r="2.5" fill="currentColor">
      <animate id="SVGgLulOGrw" attributeName="cy" begin="SVGKiXXedfO.begin+0.2s" calcMode="spline" dur="0.6s" keySplines=".33,.66,.66,1;.33,0,.66,.33" values="12;6;12" />
    </circle>
  </svg>
}

export { Loader, Loader2 };
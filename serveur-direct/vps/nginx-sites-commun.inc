# Règles communes des sites annexes (pages fixes, une par langue).
index index.html;
autoindex off;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header X-Frame-Options "SAMEORIGIN" always;
gzip on;
gzip_comp_level 5;
gzip_min_length 512;
gzip_types text/css image/svg+xml text/plain application/xml;
location ~ /\. { return 404; }
location ~* \.(html)$ { add_header Cache-Control "public, max-age=600" always; add_header X-Content-Type-Options "nosniff" always; }
location ~* \.(svg)$ { expires 30d; }
location / { try_files $uri $uri/ =404; }

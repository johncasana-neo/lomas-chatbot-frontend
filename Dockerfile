# Dockerfile — Lomas de Ancón frontend (sitio estático)
FROM nginx:alpine

# Copiar configuración personalizada de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar todo el sitio estático
COPY index.html /usr/share/nginx/html/
COPY chatbot.js /usr/share/nginx/html/
COPY styles.css /usr/share/nginx/html/
COPY uploads/ /usr/share/nginx/html/uploads/

# Páginas auxiliares (redirect a index.html#sección)
COPY actividades.html /usr/share/nginx/html/
COPY blog.html /usr/share/nginx/html/
COPY carrito.html /usr/share/nginx/html/
COPY contacto.html /usr/share/nginx/html/
COPY donaciones.html /usr/share/nginx/html/
COPY faq.html /usr/share/nginx/html/
COPY negocios-locales.html /usr/share/nginx/html/
COPY nosotros.html /usr/share/nginx/html/
COPY voluntariado.html /usr/share/nginx/html/

EXPOSE 8080

FROM php:apache-bullseye

COPY --from=composer:2.2 /usr/bin/composer /usr/bin/composer

COPY php.ini /usr/local/etc/php/php.ini
COPY init.sh /tmp/init.sh

RUN apt-get update && apt-get install -y zip git libzip-dev
RUN docker-php-ext-install pdo_mysql
RUN a2enmod rewrite

COPY ./src /var/www/html/
COPY ./apache/default.conf /etc/apache2/sites-enabled/000-default.conf

WORKDIR /var/www/html

RUN chmod -R 777 storage/ bootstrap/cache /tmp/init.sh

CMD ["/bin/bash", "-c", "/tmp/init.sh"] 
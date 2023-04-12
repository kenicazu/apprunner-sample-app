FROM php:apache-bullseye

# composer install
COPY --from=composer:2.2 /usr/bin/composer /usr/bin/composer

COPY ./docker/web/php.ini /usr/local/etc/php/php.ini
COPY ./docker/web/init.sh /tmp/init.sh

RUN apt-get update && apt-get install -y zip git libzip-dev
RUN docker-php-ext-install pdo_mysql
RUN a2enmod rewrite

# localでの開発時は以下2行をコメントアウト
# COPY ./src /var/www/html/
# COPY ./docker/web/apache/default.conf /etc/apache2/sites-enabled/000-default.conf

WORKDIR /var/www/html

# localでの開発時は以下1行をコメントアウト
RUN chmod -R 777 storage/ bootstrap/cache /tmp/init.sh

# localでの開発時は以下のコメントアウトを解除
# RUN chmod -R 777 /tmp/init.sh


CMD ["/bin/bash", "-c", "/tmp/init.sh"] 
# TFM: Detección de Vulnerabilidades y Comportamientos Anómalos en API RESTs mediante Algoritmos de Machine Learning

### Eustaquio Vercher Gómez

La expansión de los servicios digitales y arquitecturas distribuidas ha situado a las APIs REST como un componente crítico para la interoperabilidad de aplicaciones web, móviles, servicios en la nube y dispositivos IoT. Su papel central en la economía digital, gestionando información altamente sensible, las ha convertido en un objetivo prioritario para los ciberataques. Las limitaciones de los mecanismos tradicionales de monitorización, incapaces de detectar patrones complejos o ataques a aplicaciones de negocio, han puesto de relieve la necesidad de enfoques más dinámicos y adaptativos. En este contexto, el uso de técnicas de Machine Learning —tanto supervisadas como no supervisadas— ofrece un marco prometedor para la detección de anomalías en el tráfico API, al permitir el análisis de grandes volúmenes de datos y la identificación de comportamientos atípicos sin requerir conocimiento previo de las amenazas existentes. El presente trabajo aborda esta problemática con una doble motivación: por un lado, la necesidad práctica de reforzar la seguridad de las APIs REST frente a ataques cada vez más sofisticados; por otro, el interés académico en explorar la viabilidad de los algoritmos de Machine Learning como herramientas aplicadas a la ciberseguridad.

Este proyecto implementa una **API REST en TypeScript (NestJS)** instrumentada para la recolección de tráfico, junto con un pipeline de **Machine Learning** (Python) para la detección de anomalías y vulnerabilidades.  


## Crear un archivo .env con las siguientes propiedades
```
DB_TYPE=postgres
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=testdb
DB_USERNAME=root
DB_PASSWORD=example
DB_SYNC=false
SECRET = SECRET
REDIS_HOST = 127.0.0.1
REDIS_PORT = 6379
REDIS_PASSWORD = eYVX7EwVmmxKPCDmwMtyKVge8oLd2t81
REDIS_RECONNECT = always
APP_PORT = 3000
LOG_ON = true
```

## Arrancar el proyecto
```
cd docker && docker compose up --build
```

## Estructura y contenido
- **/docker**: Contiente `Dockerfile` y `docker compose` para arrancar el proyecto de forma reproducible
- **/machine-learning**: Contiene notebooks de `jupyter` con los ejercicio de Machine learning
- **/scripts**: scripts de `python`para transformar logs en CSV, generar tráfico lícito y arrancar `OWASP ZAP` con variables de entorno
- **/src**: código fuente del proyecto en `Typescript`
- **/test**: test unitarios (pendientes de implementar)
- **.gitignore**
- **.prettierrc**
- **package-lock.json**
- **package.json**
- **README.md**
- **tsconfig.build.json**
- **tsconfig.json**
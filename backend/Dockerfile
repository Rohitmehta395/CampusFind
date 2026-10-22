# Stage 1: Build Java WAR with Maven & Eclipse Temurin 21
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source and build WAR artifact
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Runtime with Apache Tomcat 10.1 (Jakarta EE 10)
FROM tomcat:10.1-jdk21-temurin
WORKDIR /usr/local/tomcat

# Clean default webapps to prevent root context conflicts
RUN rm -rf webapps/*

# Deploy application to ROOT context and campusfind-backend context
COPY --from=build /app/target/campusfind-backend.war webapps/ROOT.war
COPY --from=build /app/target/campusfind-backend.war webapps/campusfind-backend.war

EXPOSE 8080

CMD ["catalina.sh", "run"]

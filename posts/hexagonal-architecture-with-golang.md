---
title: Hexagonal Architecture with Golang
date: '2024-01-31'
tags: 
    - architecture
    - api
    - golang
---

---

## Hexagonal Architecture  (aka Ports and Adapters)
This architectural approach brings several benefits to a complex application. It might be bit a over for very simple ones, but anyways, who knows how much will our application grow?

The Ports and Adapter represent interfaces to connect external resources to our interface in a decoupled manner.
![Ports & Adapters](../images/posts/Ports-and-Adapters.png)

The idea is to isolate the core of the application (the business layer) from external resources that are just technology tools.
The business doesn't care which type of databases we're using or which framework we're using to implement an HTTP API.
In this article, we're building a very simple HTTP API CRUD for Weddings. For this example, the business just cares about a few things: being able to register, fetch, and change a Wedding record. To make it simple, we're going to use SQLite to store the data, and neither the business nor our application core cares about that.
#### Allows sustainable growth of an Application
It's easier to scale up the App if its core is decoupled from external resources.
You can defer infrastructure decisions, not related to your Use Cases/User's Stories to later and focus on core the implementation first.
It's even much easier to use a lighter infrastructure resource for development purposes.
In the implementation example of this post, we're going to use SQLite for our DB because it's much easier to set it up than a Postgres database for example. But when it's time to deploy to a robust environment, it's very easy and safe to change it.
#### Avoid the corruption of domain/business logic imposed by a framework
ORM's are a good example of that. Sometimes (maybe most of the time) ORMs or persistence frameworks require our mapped entities to implement getters and setters for all the entity fields. But maybe our business requires some fields to be immutable, thus we should avoid implementing setters for that.
But if we decouple do application core from frameworks, we're safe.
#### Supports replacement of application pieces
As I mentioned before, it makes it easy and safe to replace databases, frameworks, external APIs, and so on.
#### Allows the app to be equally driven by users, programs, automated tests, and scripts and to be developed and tested in isolation from its runtime devices and external resources
If the application core is decoupled from any UI framework, you run automated tests that don't need to emulate users' UI interaction.
Also, you can easily add a CLI interface for users to interact with your application if they want.
#### Build a boundary around the application's core logic
That's the mental model for implementing this architectural approach. Imagine a boundary protecting your application from concrete implementations of anything that is not part of the app's business logic.
In practice, ask yourself if your code still compiles and if its tests run successfully if you delete every file that is not part of the application core. That is the concrete database repository implementations, HTTP controllers, queue listeners, etc.
#### Facilitates breaking a monolith into microservices
It makes it easy move break the core into smaller contexts, port it to a new service, and then just plug in new adapters to each smaller service.
#### This is supported by SOLID's Dependency Inversion Principle
The Dependency Inversion principle states that "High-level modules should not import anything from low-level modules. Both should depend on abstractions".
Our Application core is a high-level module and our infra is a low-level module. By applying DI, we achieve the goal of decoupling the core from infra.

It also states that "Abstractions should not depend on details. Details (concrete implementations) should depend on abstractions."
Our core module depends on abstractions that are implemented by the infra module.

---

## Golang implementation
That's our goal:
![Ports & Adapters](../images/posts/ports-and-adapters-2.png)

This post has no intention of covering how to initiate a Go project, so I'm skipping that part and going directly to the code.
### Application Module
Let's start with a `Wedding Interface` to define the properties and behavior of a Wedding and the actual implementation of a Wedding, its methods, and a convenient function to create a new Wedding:

```Go
// application/wedding.go
package application

import (
	"errors"
	"time"
	  
	"github.com/google/uuid"
)  

const (
	ENABLED = "enabled"
	DISABLED = "disabled"
)

type WeddingInterface interface {
	IsValid() (bool, error)
	Enable() error
	Disable()
	GetId() string
	GetName() string
	GetDate() time.Time
	GetStatus() string
	GetBudget() float64
}

type Wedding struct {
	ID string
	Name string
	Date time.Time
	Budget float64
	Status string
}  

func NewWedding(name string, date time.Time, budget float64) (*Wedding, error) {
	wedding := Wedding{
		ID: uuid.NewString(),
		Name: name,
		Date: date,
		Status: ENABLED,
		Budget: budget,
	}
	
	if valid, err := wedding.IsValid(); !valid {
		return nil, err
	}
	
	return &wedding, nil
}  

func (w *Wedding) IsValid() (bool, error) {
	if w.Name == "" {
		return false, errors.New("The wedding name is required")
	}
	
	if w.Date.IsZero() {
		return false, errors.New("The wedding date is required")
	}
	
	if w.Status != ENABLED && w.Status != DISABLED {
		return false, errors.New("The wedding status is invalid")
	}
	
	if w.Budget < 0 {
		return false, errors.New("The wedding budget is invalid")
	}
	
	return true, nil
}

func (w *Wedding) Enable() error {
	if w.Date.Before(time.Now()) {
		return errors.New("The wedding date must be a future date")
	}
	w.Status = ENABLED
	return nil
}

func (w *Wedding) Disable() {
	w.Status = DISABLED
}

func (w *Wedding) GetId() string {
	return w.ID
}

func (w *Wedding) GetName() string {
	return w.Name
}

func (w *Wedding) GetDate() time.Time {
	return w.Date
}

func (w *Wedding) GetBudget() float64 {
	return w.Budget
}

func (w *Wedding) GetStatus() string {
	return w.Status
}
```

Nothing really special concerning the Hexagonal Architecture so far, but here we go.
Let's implement our first `Port`, an interface for Wedding persistence:

```Go
// application/ports/wedding_persistence.go
package ports

import "viniciusvasti/cerimonize/application"

type WeddingRepositoryInterface interface {
	Get(id string) (application.WeddingInterface, error)
	GetAll() ([]application.WeddingInterface, error)
	Save(wedding application.WeddingInterface) (application.WeddingInterface, error)
}
```

The second `Port` is for components outside the application core to connect with the service:

```Go
// application/ports/wedding_services_port.go
package ports

import (
	"time"
	"viniciusvasti/cerimonize/application"
)

type WeddingServiceInterface interface {
	Get(id string) (application.WeddingInterface, error)
	GetAll() ([]application.WeddingInterface, error)
	Create(name string, date time.Time, budget float64) (application.WeddingInterface, error)
	Update(wedding application.WeddingInterface) (application.WeddingInterface, error)
	Enable(wedding application.WeddingInterface) error
	Disable(wedding application.WeddingInterface) error
}
```

And the last thing to finalize the Application module is the service implementation:

```Go
// application/services/wedding_service.go
package services

import (
	"time"
	"viniciusvasti/cerimonize/application"
	"viniciusvasti/cerimonize/application/ports"
)

type WeddingService struct {
	Repository ports.WeddingRepositoryInterface
}

func NewWeddingService(repository ports.WeddingRepositoryInterface) WeddingService {
	return WeddingService{
		Repository: repository,
	}
}

func (ws WeddingService) Get(id string) (application.WeddingInterface, error) {
	wedding, err := ws.Repository.Get(id)
	if err != nil {
		return nil, err
	}
	return wedding, nil
}

func (ws WeddingService) GetAll() ([]application.WeddingInterface, error) {
	weddings, err := ws.Repository.GetAll()
	if err != nil {
		return nil, err
	}
	return weddings, nil
}

func (ws WeddingService) Create(name string, date time.Time, budget float64) (application.WeddingInterface, error) {
	wedding, err := application.NewWedding(name, date, budget)
	if err != nil {
		return nil, err
	}
	
	createdWedding, err := ws.Repository.Save(wedding)
	if err != nil {
		return nil, err
	}
	
	return createdWedding, nil
}

func (ws WeddingService) Update(wedding application.WeddingInterface) (application.WeddingInterface, error) {
	_, err := wedding.IsValid()
	if err != nil {
		return nil, err
	}
	
	updatedWedding, err := ws.Repository.Save(wedding)
	if err != nil {
		return nil, err
	}
	
	return updatedWedding, nil
}

func (ws WeddingService) Enable(wedding application.WeddingInterface) error {
	enablingError := wedding.Enable()
	if enablingError != nil {
		return enablingError
	}
	
	_, err := ws.Repository.Save(wedding)
	if err != nil {
		return err
	}
	
	return nil
}

func (ws WeddingService) Disable(wedding application.WeddingInterface) error {
	wedding.Disable()
	_, err := ws.Repository.Save(wedding)
	if err != nil {
		return err
	}
	
	return nil
}
```
Although the Service implements a `Port`, it's not an `Adapter` because it's part of the core of the application, it implements business logic.
Notice how it doesn't care about the concrete implementation of a database repository. It's decoupled from that.

It's time for the adapters. Starting with the SQLite Repository Adapter:

```Go
// adapters/sqldb/wedding.go
package sqldb

import (
	"database/sql"
	"time"
	"viniciusvasti/cerimonize/adapters/sqldb/util"
	"viniciusvasti/cerimonize/application"
)

type WeddingSQLRepository struct {
	db *sql.DB
}

func NewWeddingSQLRepository(db *sql.DB) *WeddingSQLRepository {
	createTable(db)
	return &WeddingSQLRepository{db: db}
}

func (p *WeddingSQLRepository) Get(id string) (application.WeddingInterface, error) {
	var wedding application.Wedding

	// Prepare statement for preventing SQL injection
	statement, err := p.db.Prepare("SELECT id, name, date, budget, status FROM weddings WHERE id = ?")
	if err != nil {
		return nil, err
	}
	defer statement.Close()

	dateString := ""
	err = statement.QueryRow(id).Scan(&wedding.ID, &wedding.Name, &dateString, &wedding.Budget, &wedding.Status)
	if err != nil {
		return nil, err
	}

	wedding.Date, err = time.Parse("2006-01-02 15:04:05-07:00", dateString)
	if err != nil {
		return nil, err
	}

	return &wedding, nil
}

func (p *WeddingSQLRepository) GetAll() ([]application.WeddingInterface, error) {
	var weddings []application.WeddingInterface = make([]application.WeddingInterface, 0)

	// Prepare statement for preventing SQL injection
	statement, err := p.db.Prepare("SELECT id, name, date, budget, status FROM weddings")
	if err != nil {
		return nil, err
	}
	defer statement.Close()

	rows, err := statement.Query()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var wedding application.Wedding
		dateString := ""
		err = rows.Scan(&wedding.ID, &wedding.Name, &dateString, &wedding.Budget, &wedding.Status)
		if err != nil {
			return nil, err
		}

		wedding.Date, err = time.Parse("2006-01-02 15:04:05-07:00", dateString)
		if err != nil {
			return nil, err
		}

		weddings = append(weddings, &wedding)
	}

	return weddings, nil
}

func (p *WeddingSQLRepository) Save(wedding application.WeddingInterface) (application.WeddingInterface, error) {
	var rows int
	statement, err := p.db.Prepare("SELECT COUNT(*) FROM weddings WHERE id = ?")
	statement.QueryRow(wedding.GetId()).Scan(&rows)
	if err != nil {
		return nil, err
	}
	defer statement.Close()

	if rows == 0 {
		_, err := p.create(wedding)
		if err != nil {
			return nil, err
		}
	} else {
		_, err := p.update(wedding)
		if err != nil {
			return nil, err
		}
	}

	return wedding, nil
}

func (p *WeddingSQLRepository) create(wedding application.WeddingInterface) (application.WeddingInterface, error) {
	statement, err := p.db.Prepare("INSERT INTO weddings (id, name, date, budget, status) VALUES (?, ?, ?, ?, ?)")
	if err != nil {
		return nil, err
	}
	defer statement.Close()

	_, err = statement.Exec(wedding.GetId(), wedding.GetName(), wedding.GetDate(), wedding.GetBudget(), wedding.GetStatus())
	if err != nil {
		return nil, err
	}

	return wedding, nil
}

func (p *WeddingSQLRepository) update(wedding application.WeddingInterface) (application.WeddingInterface, error) {
	statement, err := p.db.Prepare("UPDATE weddings SET name = ?, date = ?, budget = ?, status = ? WHERE id = ?")
	if err != nil {
		return nil, err
	}
	defer statement.Close()

	_, err = statement.Exec(wedding.GetName(), wedding.GetDate(), wedding.GetBudget(), wedding.GetStatus(), wedding.GetId())
	if err != nil {
		return nil, err
	}

	return wedding, nil
}
```

The other adapter we're implementing is an HTTP server to expose our application through HTTP Endpoints.
But first, let's implement DTOs (Data Transfer Objects) to give us the power to expose just the details we want about a Wedding. We have nothing to hide so far, but I'm sure I'm going to add metadata properties like `created/updated by` and `created/updated at` for instance and I don't want to expose these fields.

```Go
// adapters/dto/wedding.go
package dto

import (
	"time"
	"viniciusvasti/cerimonize/application"
)

type WeddingDTO struct {
	ID     string  `json:"id"`
	Name   string  `json:"name"`
	Date   string  `json:"date"`
	Budget float64 `json:"budget"`
	Status string  `json:"status"`
}

func (w *WeddingDTO) Bind(wedding application.WeddingInterface) {
	w.ID = wedding.GetId()
	w.Name = wedding.GetName()
	w.Date = wedding.GetDate().String()
	w.Budget = wedding.GetBudget()
	w.Status = wedding.GetStatus()
}

func BindAll(weddings []application.WeddingInterface) []WeddingDTO {
	var weddingsDTO []WeddingDTO
	for _, wedding := range weddings {
		var weddingDTO WeddingDTO
		weddingDTO.Bind(wedding)
		weddingsDTO = append(weddingsDTO, weddingDTO)
	}
	return weddingsDTO
}

func (w WeddingDTO) ConvertToEntity() (*application.Wedding, error) {
	date, err := time.Parse("2006-01-02 15:04:05-07:00", w.Date)
	if err != nil {
		return nil, err
	}
	return &application.Wedding{
		ID:     w.ID,
		Name:   w.Name,
		Date:   date,
		Budget: w.Budget,
		Status: w.Status,
	}, nil
}
```

Now we're ready to implement the HTTP Handlers for the HTTP Verbs `GET`, `POST`, and `PUT`.
They're very coupled to the `Echo` Go framework we're using in this project, so that's why we need to avoid coupling our service to it.

```Go
// adapters/web/rest/handler/wedding.go
package rest_handler

import (
	"net/http"
	"viniciusvasti/cerimonize/adapters/dto"
	"viniciusvasti/cerimonize/application/ports"

	"github.com/labstack/echo/v4"
	"github.com/labstack/gommon/log"
)

type WeddingRestHandler struct {
	Service ports.WeddingServiceInterface
}

func (wh WeddingRestHandler) HandleGet(c echo.Context) error {
	wedding, err := wh.Service.Get(c.Param("id"))
	if err != nil {
		// TODO: Find a better way to handle this error
		if err.Error() == "sql: no rows in result set" {
			return echo.NewHTTPError(http.StatusNotFound, "Wedding not found")
		}
		log.Error(err.Error())
		return echo.NewHTTPError(http.StatusInternalServerError, "Internal server error")
	}
	weddingDTO := dto.WeddingDTO{}
	weddingDTO.Bind(wedding)
	return c.JSON(http.StatusOK, weddingDTO)
}

func (wh WeddingRestHandler) HandleGetAll(c echo.Context) error {
	result, err := wh.Service.GetAll()
	if err != nil {
		log.Error(err.Error())
		return echo.NewHTTPError(http.StatusInternalServerError, "Internal server error")
	}
	weddingsDTO := dto.BindAll(result)
	return c.JSON(http.StatusOK, weddingsDTO)
}

func (wh WeddingRestHandler) HandleCreate(c echo.Context) error {
	weddingDTO := dto.WeddingDTO{}
	if err := c.Bind(&weddingDTO); err != nil {
		log.Error(err.Error())
		return echo.NewHTTPError(http.StatusUnprocessableEntity, "Invalid request body")
	}

	wedding, err := weddingDTO.ConvertToEntity()
	if err != nil {
		log.Error(err.Error())
		return echo.NewHTTPError(http.StatusUnprocessableEntity, "Invalid request body")
	}

	createdWedding, err := wh.Service.Create(wedding.GetName(), wedding.GetDate(), wedding.GetBudget())
	if err != nil {
		log.Error(err.Error())
		return echo.NewHTTPError(http.StatusInternalServerError, "Internal server error")
	}
	createdDTO := dto.WeddingDTO{}
	createdDTO.Bind(createdWedding)
	return c.JSON(http.StatusCreated, createdDTO)
}

func (wh WeddingRestHandler) HandleUpdate(c echo.Context) error {
	weddingDTO := dto.WeddingDTO{}
	if err := c.Bind(&weddingDTO); err != nil {
		log.Error(err.Error())
		return echo.NewHTTPError(http.StatusUnprocessableEntity, "Invalid request body")
	}

	wedding, err := weddingDTO.ConvertToEntity()
	if err != nil {
		log.Error(err.Error())
		return echo.NewHTTPError(http.StatusUnprocessableEntity, "Invalid request body")
	}

	updatedWedding, err := wh.Service.Update(wedding)
	if err != nil {
		log.Error(err.Error())
		return echo.NewHTTPError(http.StatusInternalServerError, "Internal server error")
	}
	updatedDTO := dto.WeddingDTO{}
	updatedDTO.Bind(updatedWedding)
	return c.JSON(http.StatusOK, updatedDTO)
}

```

Now we can implement our Server component which will set everything needed to run the API

```Go
// adapters/web/rest/server.go
package rest

import (
	"database/sql"
	"log"
	"time"
	"viniciusvasti/cerimonize/adapters/sqldb"
	page_handler "viniciusvasti/cerimonize/adapters/web/pages/handler"
	rest_handler "viniciusvasti/cerimonize/adapters/web/rest/handler"
	"viniciusvasti/cerimonize/application/services"

	"github.com/labstack/echo/v4"
	_ "github.com/mattn/go-sqlite3"
)

type Server struct {
}

func (s *Server) Serve() {
	app := echo.New()
	app.HideBanner = true
	app.Server.ReadTimeout = time.Second * 10
	app.Static("/public", "public")

	// Web App
	landingHandler := page_handler.LandingPageHandler{}
	app.GET("/", landingHandler.Handle)
	app.POST("/cadastrar", func(c echo.Context) error {
		c.Response().Header().Set("Content-Type", "application/json")
		newEmail := c.FormValue("email")
		log.Printf("New email: %s", newEmail)
		return c.Redirect(302, "/?registered=true")
	})

	// REST API
	cerimonizoRoutes := app.Group("/api")
	makeWeddingRoutes(cerimonizoRoutes)

	err := app.Start(":3000")
	if err != nil {
		log.Fatal(err)
	}
}

func makeWeddingRoutes(cerimonizoRoutes *echo.Group) {
	database, err := sql.Open("sqlite3", "database.db")
	if err != nil {
		log.Fatal(err.Error())
	}
	weddingRepository := sqldb.NewWeddingSQLRepository(database)
	weddingService := services.NewWeddingService(weddingRepository)
	weddingRoutes := cerimonizoRoutes.Group("/weddings")
	weddingHandler := rest_handler.WeddingRestHandler{
		Service: weddingService,
	}
	weddingRoutes.GET("", weddingHandler.HandleGetAll)
	weddingRoutes.GET("/:id", weddingHandler.HandleGet)
	weddingRoutes.POST("", weddingHandler.HandleCreate)
	weddingRoutes.PUT("/:id", weddingHandler.HandleUpdate)
}

```
Note how a concrete DB Repository implementation for SQL is injected into the Application Service. Once the Service is expecting an Interface, it can be easily changed to a NoSQL DB or any other database.

And that's how we start the server

```Go
// cmd/main.go
package main

import "viniciusvasti/cerimonize/adapters/web/rest"

func main() {
	server := rest.Server{}
	server.Serve()
}
```
We could also move the responsibility of creating the concrete instances to this `main` function and inject it into the Server. Yeah, it should be the way to go so we don't need to touch the Server implementation when changing adapters. But I think it's enough for this post. We covered an implementation of Hexagonal Architecture for Golang.

Of course, this structure is just one way of achieving that.
The Hexagonal Architecture original paper doesn't enforce many things. It just presents the concepts and goals of `Ports and Adapters`.

---

The complete code of this post can be found at [hexagonal-architecture](https://github.com/viniciusvasti/cerimonizo/tree/hexagonal-architecture)
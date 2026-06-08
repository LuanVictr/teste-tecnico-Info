.PHONY: start stop restart logs test clean

start: .env
	docker compose up -d --build
	@echo ""
	@echo "Aguardando a aplicação inicializar..."
	@sleep 10
	@echo ""
	@echo "  Swagger UI : http://localhost:3000/api/docs"
	@echo "  RabbitMQ   : http://localhost:15672  (guest / guest)"
	@echo ""

stop:
	docker compose down

restart: stop start

logs:
	docker compose logs -f app

test:
	npm run test

clean:
	docker compose down -v

.env:
	cp .env.example .env
	@echo "[setup] .env criado a partir de .env.example"

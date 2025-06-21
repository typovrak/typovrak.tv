.PHONY: docker-down
docker-down:
	docker compose down

.PHONY: docker-up
docker-up:
	docker compose up

.PHONY: docker-restart
docker-restart:
	docker compose down && docker compose up

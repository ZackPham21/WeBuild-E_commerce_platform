package com.yorku.eecs4413.catalogue.item;

import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.web.PagedResourcesAssembler;
import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.PagedModel;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.yorku.eecs4413.catalogue.item.dto.CreateItemRequest;
import com.yorku.eecs4413.catalogue.item.dto.ItemResponse;
import com.yorku.eecs4413.catalogue.item.dto.UpdateItemRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/items")
public class ItemController {

    private final ItemService service;
    private final ItemModelAssembler assembler;
    private final PagedResourcesAssembler<Item> pagedAssembler;

    public ItemController(ItemService service,
                          ItemModelAssembler assembler,
                          PagedResourcesAssembler<Item> pagedAssembler) {
        this.service = service;
        this.assembler = assembler;
        this.pagedAssembler = pagedAssembler;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EntityModel<ItemResponse> create(@Valid @RequestBody CreateItemRequest req) {
        return assembler.toModel(service.create(req));
    }

    @GetMapping("/{id}")
    public EntityModel<ItemResponse> get(@PathVariable UUID id) {
        return assembler.toModel(service.get(id));
    }

    // GET /items (active list)
    @GetMapping
    public PagedModel<EntityModel<ItemResponse>> list(@PageableDefault(size = 20) Pageable pageable) {
        return pagedAssembler.toModel(service.listActive(pageable), assembler);
    }

    // GET /items/search?keyword=phone
    @GetMapping("/search")
    public PagedModel<EntityModel<ItemResponse>> search(@RequestParam String keyword,
                                                        @PageableDefault(size = 20) Pageable pageable) {
        return pagedAssembler.toModel(service.searchActive(keyword, pageable), assembler);
    }

    // GET /items/category?name=electronics
    @GetMapping("/category")
    public PagedModel<EntityModel<ItemResponse>> byCategory(@RequestParam("name") String category,
                                                            @PageableDefault(size = 20) Pageable pageable) {
        return pagedAssembler.toModel(service.listActiveByCategory(category, pageable), assembler);
    }

    @PutMapping("/{id}")
    public EntityModel<ItemResponse> update(@PathVariable UUID id,
                                           @Valid @RequestBody UpdateItemRequest req) {
        return assembler.toModel(service.update(id, req));
    }

    // used by auction-service later, or admin
    @PostMapping("/{id}/end")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void end(@PathVariable UUID id) {
        service.end(id);
    }
}
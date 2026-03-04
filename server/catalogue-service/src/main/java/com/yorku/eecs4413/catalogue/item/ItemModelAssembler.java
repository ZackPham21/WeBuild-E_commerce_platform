package com.yorku.eecs4413.catalogue.item;

import java.util.UUID;

import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.server.RepresentationModelAssembler;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.linkTo;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.methodOn;
import org.springframework.stereotype.Component;

import com.yorku.eecs4413.catalogue.item.dto.ItemResponse;

@Component
public class ItemModelAssembler implements RepresentationModelAssembler<Item, EntityModel<ItemResponse>> {

    @Override
    public EntityModel<ItemResponse> toModel(Item item) {
        ItemResponse body = ItemResponse.from(item);
        UUID id = item.getId();

        return EntityModel.of(
                body,
                linkTo(methodOn(ItemController.class).get(id)).withSelfRel(),

                // collection link: GET /items
                linkTo(ItemController.class).withRel("items"),

                linkTo(ItemController.class).slash("search").withRel("search"),
                linkTo(ItemController.class).slash("category").withRel("category"),

                // action link for ending: POST /items/{id}/end
                linkTo(ItemController.class).slash(id).slash("end").withRel("end")
        );
    }
}
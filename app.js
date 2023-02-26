//jshint esversion: 6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const _ = require("lodash");

// Database libraries
const mongoose = require('mongoose');
mongoose.set('strictQuery', false);

// Database Setup
mongoose.connect('mongodb://localhost:27017/todolistDB');

const itemsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "ToDo list item must have a name"]
    }
});
const Item = mongoose.model("Item", itemsSchema);

// Default tasks if DB is empty
const task1 = new Item({
    name: 'Welcome to your todolist!'
});
const task2 = new Item({
    name: 'Hit the + button to add a new item.'
});
const task3 = new Item({
    name: '<-- Hit this to delete an item.'
});
const defaultItems = [task1, task2, task3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};
const List = mongoose.model("List", listSchema);

const app = express();

app.set('view engine', 'ejs');

app.use(express.static("public"));

app.use(bodyParser.urlencoded({
    extended: true
}));

app.get("/", function (req, res) {

    const day = date.getDate();

    Item.find({}, function (err, items) {
        if (err) {
            console.log(err);
        } else {
            if (items.length === 0) {
                Item.insertMany(defaultItems, function (error, items) {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log("Successfully saved default database!");
                        res.redirect("/");
                    }
                });
            } else {
                res.render("list", {
                    listTitle: day,
                    newListItem: items
                });
            }

        }
    });


});

app.post("/", function (req, res) {

    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    console.log(listName);
    console.log(itemName);

    if (listName == date.getDate()) {
        item.save();
        res.redirect("/");
    } else {
        
        List.findOne({
            name: listName
        }, function (err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        });
    }




});

app.post("/delete", function (req, res) {

    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    console.log(listName);
    console.log(checkedItemId);

    if (listName == date.getDate()) {
        Item.findByIdAndRemove(
            checkedItemId,
            function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Successfully deleted the checked item!");
                }
            });

        res.redirect("/");
    } else {
        List.findOneAndUpdate({
            name: listName
        }, {
            $pull: {
                items: {
                    _id: checkedItemId
                }
            }
        }, function (err, results) {
            console.log("FOUND");
            console.log(results);
            if (!err) {
                res.redirect("/" + listName);
            } else {
                console.log(err);
            }
        });

        
    }


});

// Dynamic URL
app.get("/:customListName", function (req, res) {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({
        name: customListName
    }, function (err, foundList) {
        if (!err) {
            if (!foundList) {
                console.log("List doesn't exist!");
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });

                list.save();

                res.redirect("/" + customListName);
            } else {
                console.log("List exists!");
                res.render("list", {
                    listTitle: foundList.name,
                    newListItem: foundList.items
                });
            }
        }
    });
});


app.get("/about", function (req, res) {
    res.render("about");
});

app.listen(process.env.PORT || 3000, function () {
    console.log("Server is running on port 3000.");
});
const express = require("express");
const amqp = require("amqplib");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/products", async (req, res) => {
    const { name, price, description } = req.body;
    if (!name || !price || !description) {
        return res.status(400).json({
            message: "Please provide name, price and description",
        });
    }
    return res.status(201).json({
        message: "Product created successfully",
        product: {
            ...req.body
        },
    });
});

// Buy a product
app.post("/buy", async (req, res) => {
    let order;
    const products = [
        {
            "name": "products_1",
            "price": 67,
            "description": "checking products"
        },
        {
            "name": "products_2",
            "price": 68,
            "description": "checking products_2"
        }
    ]
    // Send order to RabbitMQ order queue
    channel.sendToQueue(
        "order-service-queue",
        Buffer.from(
            JSON.stringify({
                products
            })
        )
    );

    // Consume previously placed order from RabbitMQ & acknowledge the transaction
    channel.consume("product-service-queue", (data) => {
        console.log("Consumed from product-service-queue");
        order = JSON.parse(data.content);
        console.log("order");
        console.log(JSON.stringify(order));
        
        channel.ack(data);
    });

    // Return a success message
    return res.status(201).json({
        message: "Order placed successfully",
        order,
    });
});

app.listen(PORT, async () => {
    await connectToRabbitMQ();
    console.log(`Product-Service listening on port ${PORT}`);
});

async function connectToRabbitMQ() {
    const amqpServer = "amqps://ohocpqgl:QBCwAwl6owLn3Qv5fAlr16yOuTB1qR8P@moose.rmq.cloudamqp.com/ohocpqgl";
    connection = await amqp.connect(amqpServer);
    channel = await connection.createChannel();
    await channel.assertQueue("product-service-queue");
}
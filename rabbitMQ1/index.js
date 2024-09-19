const express = require("express");
const app = express();
const PORT = process.env.PORT || 3002;
const amqp = require("amqplib");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
var channel, connection;

// RabbitMQ connection
async function connectToRabbitMQ() {
    const amqpServer = "amqps://ohocpqgl:QBCwAwl6owLn3Qv5fAlr16yOuTB1qR8P@moose.rmq.cloudamqp.com/ohocpqgl";
    connection = await amqp.connect(amqpServer);
    channel = await connection.createChannel();
    await channel.assertQueue("order-service-queue");
}

// Create an order
createOrder = (products) => {
    let total = 0;
    products.forEach((product) => {
        total += product.price;
    });
    return products;
};


app.listen(PORT, () => {
    connectToRabbitMQ().then(() => {
        console.log('rabbit success');

        channel.consume("order-service-queue", (data) => {
            // order service queue listens to this queue
            const { products } = JSON.parse(data.content);
            console.log("products");
            console.log(JSON.stringify(products));
            const newOrder = createOrder(products);
            channel.ack(data);
            channel.sendToQueue(
                "product-service-queue",
                Buffer.from(JSON.stringify({ newOrder, message: "order success" }))
            );
        });
    });
    console.log(`Order-Service listening on port ${PORT}`);
});

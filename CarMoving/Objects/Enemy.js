import { tiny, defs } from "../project-resources.js";

const { Vec, Mat4, Material, Texture } = tiny;
//const { vec3, vec4, vec, color, Mat4, Light, Shape, Material, Shader, Texture, Scene } = tiny;
const { Cube } = defs;

class Enemy {
    constructor(position = Vec.of(0, 0, 70)) {
        this.shape = new Cube();
        this.material = new Material(new defs.Textured_Phong(3), {
            texture: new Texture("assets/skin.jpg"),
            ambient: 1
        });
        this.position = position;
        this.rotation = Vec.of(0, 180, 0);
        this.RUN_SPEED = 30;
        this.TURN_SPEED = 160;
        this.GRAVITY = -50;
        this.JUMP_POWER = 30;
        this.current_speed = 0;
        this.current_turn_speed = 0;
        this.current_look_up_spped = 0;
        this.look_up_angle = 0;
        this.upwards_speed = 0;
        this.is_in_air = false;
        this.HEIGHT_TO_GROUND = 4.5;
        this.limb_angle = 0;
        this.ZOOM_SPEED = 50;
        this.current_zoom_speed = 0;
        this.current_zoom_factor = 7;
        this.HEIGHT_TO_EYES = 2.5;
        this.sounds = {
            walk: new Audio("assets/walk.wav"),
            jump: new Audio("assets/jump.wav"),
            // walk_in_water: new Audio("assets/water_footstep.wav")
        };
        this.is_in_water = false;
        this.movement = 0;
    }

    is_near_object(object_position, distance_square = 10000) {
        const dx = this.position[0] - object_position[0];
        const dz = this.position[2] - object_position[2];

        return dx * dx + dz * dz < distance_square;
    }


    play_sound(name, volume = 0.5) {
        if (!this.sounds[name].paused) return;
        this.sounds[name].currentTime = 0;
        this.sounds[name].volume = volume;
        this.sounds[name].play();
    }

    pause_sound(name) {
        this.sounds[name].pause();
        this.sounds[name].currentTime = 0;
    }

    update(program_state) {
        const dt = program_state.dt;

        if (
            this.is_near_object(
                program_state.water.position,
                program_state.water.size * program_state.water.size
            )
        ) {
            this.is_in_water = true;
        } else {
            this.is_in_water = false;
        }

        this.rotation = this.rotation.plus(
            Vec.of(0, this.current_turn_speed * dt, 0)
        );

        this.look_up_angle = this.look_up_angle + this.current_look_up_spped * dt;

        this.current_zoom_factor = Math.max(
            2,
            this.current_zoom_factor + this.current_zoom_speed * dt
        );

        const distance = this.current_speed * dt;
        const dx = distance * Math.sin(((2 * Math.PI) / 360) * this.rotation[1]);
        const dz = distance * Math.cos(((2 * Math.PI) / 360) * this.rotation[1]);
        this.position = this.position.plus(Vec.of(dx, 0, dz));

        this.upwards_speed += this.GRAVITY * dt;
        this.position = this.position.plus(Vec.of(0, this.upwards_speed * dt, 0));

        let terrain_height = program_state.current_terrain.get_height(
            this.position[0],
            this.position[2]
        );

        if (this.position[1] < terrain_height + this.HEIGHT_TO_GROUND) {
            this.upwards_speed = 0;
            this.is_in_air = false;
            this.position[1] = terrain_height + this.HEIGHT_TO_GROUND;
        }
        //restriction 
        if (this.position[0]  > 100 )
        {
            this.position[0] = this.position[0] - 3;
        }
        else if (this.position[0] < -100)
        {
            this.position[0] = this.position[0] + 3;
        }
        if (this.position[2] > 100 )
        {
            this.position[2] = this.position[2] - 3;
        }
        else if (this.position[2] < -100)
        {
            this.position[2] = this.position[2] + 3;
        }
        //
        // if (!this.is_in_air && this.current_speed) {
        //   if (this.is_in_water) {
        //     this.play_sound("walk_in_water");
        //     this.pause_sound("walk");
        //   } else {
        //     this.play_sound("walk");
        //     this.pause_sound("walk_in_water");
        //   }
        // } else {
        //   if (this.is_in_water) {
        //     this.pause_sound("walk_in_water");
        //   } else {
        //     this.pause_sound("walk");
        //   }
        // }
    }

    jump() {
        if (!this.is_in_air) {
            this.pause_sound("jump");
            this.play_sound("jump");
            this.upwards_speed = this.JUMP_POWER;
            this.is_in_air = true;
        }
    }

    draw(context, program_state) {
        let t = program_state.animation_time / 1000;
        if(t%2) {
            this.movement = Math.floor((Math.random() * 7));
        }

        switch(this.movement) {
            case 0:
                this.current_speed = this.RUN_SPEED;
                break;
            case 1:
                this.current_speed = -this.RUN_SPEED;
                break;
            case 2:
                this.current_turn_speed = this.TURN_SPEED;
                this.current_speed = this.RUN_SPEED;
                break;
            case 3:
                this.current_turn_speed = -this.TURN_SPEED;
                this.current_speed = this.RUN_SPEED;
                break;
            case 4:
                break;
            case 5:
                this.current_speed = 2.0 * this.RUN_SPEED;
                break;
            case 6:
                break;
            case 7:
                break;
        }
        this.limb_angle = this.current_speed
            ? (Math.PI / 3) * Math.sin(program_state.animation_time / 150)
            : 0;
        let transforms = [];
        /* 
        //old 
        // body
        transforms.push(Mat4.identity().times(Mat4.scale([1, 1.5, 1])));

        // head
        transforms.push(
            Mat4.identity()
                .times(Mat4.translation([0, 2.5, 0]))
                .times(Mat4.rotation(this.limb_angle / 6, [0, 1, 0]))
        );

        // left arm
        transforms.push(
            Mat4.identity()
                .times(Mat4.translation([1.5, 0, 0]))
                .times(Mat4.translation([0, 1.5, 0]))
                .times(Mat4.rotation(this.limb_angle / 2, [1, 0, 0]))
                .times(Mat4.translation([0, -1.5, 0]))
                .times(Mat4.scale([0.5, 1.5, 1]))
        );

        // right arm
        transforms.push(
            Mat4.identity()
                .times(Mat4.translation([-1.5, 0, 0]))
                .times(Mat4.translation([0, 1.5, 0]))
                .times(Mat4.rotation(-this.limb_angle / 2, [1, 0, 0]))
                .times(Mat4.translation([0, -1.5, 0]))
                .times(Mat4.scale([0.5, 1.5, 1]))
        );

        // left leg
        transforms.push(
            Mat4.identity()
                .times(Mat4.translation([0.5, -3, 0]))
                .times(Mat4.translation([0, 1.5, 0]))
                .times(Mat4.rotation(-this.limb_angle, [1, 0, 0]))
                .times(Mat4.translation([0, -1.5, 0]))
                .times(Mat4.scale([0.5, 1.5, 1]))
        );

        // right leg
        transforms.push(
            Mat4.identity()
                .times(Mat4.translation([-0.5, -3, 0]))
                .times(Mat4.translation([0, 1.5, 0]))
                .times(Mat4.rotation(this.limb_angle, [1, 0, 0]))
                .times(Mat4.translation([0, -1.5, 0]))
                .times(Mat4.scale([0.5, 1.5, 1]))
        );
*/

// body
transforms.push(Mat4.identity().times(Mat4.scale([2, 1.5, 3])));

// head
transforms.push(
    Mat4.identity()
        .times(Mat4.translation([0, 2.5, 3]))
        .times(Mat4.scale([1.5,1,1.5]))
        .times(Mat4.rotation(this.limb_angle / 6, [0, 1, 0]))
);

//left horn
transforms.push(
    Mat4.identity()
        .times(Mat4.translation([1, 4.5, 3.5]))
        .times(Mat4.scale([.5,1,.5]))
        .times(Mat4.rotation(this.limb_angle / 6, [0, 1, 0]))
);
//right horn
transforms.push(
    Mat4.identity()
        .times(Mat4.translation([-1, 4.5, 3.5]))
        .times(Mat4.scale([.5,1,.5]))
        .times(Mat4.rotation(this.limb_angle / 6, [0, 1, 0]))
);

// left arm
/*
transforms.push(
    Mat4.identity()
        .times(Mat4.translation([1.5, 0, 0]))
        .times(Mat4.translation([0, 1.5, 0]))
        .times(Mat4.rotation(this.limb_angle / 2, [1, 0, 0]))
        .times(Mat4.translation([0, -1.5, 0]))
        .times(Mat4.scale([0.5, 1.5, 1]))
);

// right arm
transforms.push(
    Mat4.identity()
        .times(Mat4.translation([-1.5, 0, 0]))
        .times(Mat4.translation([0, 1.5, 0]))
        .times(Mat4.rotation(-this.limb_angle / 2, [1, 0, 0]))
        .times(Mat4.translation([0, -1.5, 0]))
        .times(Mat4.scale([0.5, 1.5, 1]))
);
*/
// left leg front
transforms.push(
    Mat4.identity()
        .times(Mat4.translation([1, -3, 2]))
        .times(Mat4.translation([0, 1.5, 0]))
        .times(Mat4.rotation(-this.limb_angle, [1, 0, 0]))
        .times(Mat4.translation([0, -1.5, 0]))
        .times(Mat4.scale([0.5, 1.5, 1]))
);

// right leg front
transforms.push(
    Mat4.identity()
        .times(Mat4.translation([-1, -3, 2]))
        .times(Mat4.translation([0, 1.5, 0]))
        .times(Mat4.rotation(this.limb_angle, [1, 0, 0]))
        .times(Mat4.translation([0, -1.5, 0]))
        .times(Mat4.scale([0.5, 1.5, 1]))
);

// left leg back
transforms.push(
    Mat4.identity()
        .times(Mat4.translation([1, -3, -2]))
        .times(Mat4.translation([0, 1.5, 0]))
        .times(Mat4.rotation(this.limb_angle, [1, 0, 0]))
        .times(Mat4.translation([0, -1.5, 0]))
        .times(Mat4.scale([0.5, 1.5, 1]))
);

// right leg back
transforms.push(
    Mat4.identity()
        .times(Mat4.translation([-1, -3, -2]))
        .times(Mat4.translation([0, 1.5, 0]))
        .times(Mat4.rotation(-this.limb_angle, [1, 0, 0]))
        .times(Mat4.translation([0, -1.5, 0]))
        .times(Mat4.scale([0.5, 1.5, 1]))
);
        transforms.forEach((transform, index) => {
            this.shape.draw(
                context,
                program_state,
                Mat4.identity()
                    .times(
                        Mat4.translation([
                            this.position[0],
                            this.position[1],
                            this.position[2]
                        ])
                    )
                    .times(
                        Mat4.rotation(((2 * Math.PI) / 360) * this.rotation[1], [0, 1, 0])
                    )
                    .times(transform),
                this.material
            );
        });
    }
}

export default Enemy;
